import { apiRequest } from "./api-client";
import { FoodApiError } from "./food-api";
import { authApi } from "./auth-api";

export type AdminEntity =
  | "categories"
  | "restaurants"
  | "menu_items"
  | "customization_groups"
  | "customization_options"
  | "customers"
  | "addresses"
  | "orders"
  | "order_items"
  | "payments"
  | "riders"
  | "order_status_history";

export type AdminRow = Record<string, string | number | boolean | null>;

export interface AdminOrderItem {
  [key: string]: unknown;
  options?: AdminRow[];
}

export interface AdminOrderDetail {
  [key: string]: unknown;
  items?: AdminOrderItem[];
  payment?: AdminRow | null;
  status_history?: AdminRow[];
}

export interface AdminStats {
  restaurants: number;
  active_restaurants: number;
  menu_items: number;
  available_menu_items: number;
  orders: number;
  active_orders: number;
  customers: number;
  riders: number;
  today_orders: number;
  today_revenue: number;
  total_revenue: number;
}

export interface AdminSnapshot {
  stats: AdminStats;
  recent_orders: AdminRow[];
  categories: AdminRow[];
  restaurants: AdminRow[];
  menu_items: AdminRow[];
  customers: AdminRow[];
  addresses: AdminRow[];
  riders: AdminRow[];
  payments: AdminRow[];
  order_details: Record<string, AdminOrderDetail>;
}

const entityPaths: Partial<Record<AdminEntity, string>> = {
  categories: "categories",
  restaurants: "restaurants",
  menu_items: "menu-items",
  customers: "customers",
  addresses: "addresses",
  orders: "orders",
  riders: "riders",
};

const prefixes: Partial<Record<AdminEntity, string>> = {
  categories: "CAT",
  restaurants: "RES",
  menu_items: "MENU",
  customers: "CUS",
  addresses: "ADR",
  riders: "RID",
};

const idFields: Partial<Record<AdminEntity, string>> = {
  categories: "category_id",
  restaurants: "restaurant_id",
  menu_items: "menu_item_id",
  customers: "customer_id",
  addresses: "address_id",
  riders: "rider_id",
};

const createId = (prefix: string) =>
  `${prefix}${crypto.randomUUID().replaceAll("-", "")}`.slice(0, 16);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(`/${path}`, init, "admin");
}

const listRows = (entity: AdminEntity) => {
  const path = entityPaths[entity];
  if (!path) throw new FoodApiError(`ยังไม่มี REST endpoint สำหรับ ${entity}`);
  return request<AdminRow[]>(path);
};

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (cursor < values.length) {
        const index = cursor++;
        results[index] = await mapper(values[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

const bangkokDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

function entityPath(entity: AdminEntity) {
  const path = entityPaths[entity];
  if (!path) throw new FoodApiError(`ยังไม่มี REST endpoint สำหรับ ${entity}`);
  return path;
}

export const adminApi = {
  authenticate: (adminKey: string) =>
    authApi.adminLogin(adminKey),
  snapshot: async (): Promise<AdminSnapshot> => {
    const [categories, restaurants, menuItems, customers, addresses, riders, orders] = await Promise.all([
      listRows("categories"),
      listRows("restaurants"),
      listRows("menu_items"),
      listRows("customers"),
      listRows("addresses"),
      listRows("riders"),
      listRows("orders"),
    ]);
    const orderDetails = await mapWithConcurrency(
      orders,
      6,
      (order) => request<AdminOrderDetail>(`orders/${encodeURIComponent(String(order.order_id))}`),
    );
    const payments = orderDetails
      .map((order) => order.payment)
      .filter(Boolean) as unknown as AdminRow[];
    const today = bangkokDate();
    const todayOrders = orders.filter((order) => String(order.ordered_at || "").slice(0, 10) === today);
    const paidOrders = orders.filter((order) => order.payment_status === "paid");
    return {
      stats: {
        restaurants: restaurants.length,
        active_restaurants: restaurants.filter((row) => row.is_active).length,
        menu_items: menuItems.length,
        available_menu_items: menuItems.filter((row) => row.is_available).length,
        orders: orders.length,
        active_orders: orders.filter((row) => !["delivered", "cancelled"].includes(String(row.order_status))).length,
        customers: customers.length,
        riders: riders.length,
        today_orders: todayOrders.length,
        today_revenue: todayOrders.filter((row) => row.payment_status === "paid").reduce((sum, row) => sum + Number(row.total || 0), 0),
        total_revenue: paidOrders.reduce((sum, row) => sum + Number(row.total || 0), 0),
      },
      recent_orders: orders,
      categories,
      restaurants,
      menu_items: menuItems,
      customers,
      addresses,
      riders,
      payments,
      order_details: Object.fromEntries(
        orderDetails.map((detail) => [String(detail.order_id), detail]),
      ),
    };
  },
  list: async (entity: AdminEntity, query = "") => {
    const rows = await listRows(entity);
    const filtered = query
      ? rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query.toLowerCase())))
      : rows;
    return { entity, headers: Object.keys(filtered[0] || {}), rows: filtered };
  },
  upsert: (
    entity: AdminEntity,
    values: AdminRow,
    id?: string,
  ) =>
    request<AdminRow>(`${entityPath(entity)}${id ? `/${encodeURIComponent(id)}` : ""}`, {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(
        id || !idFields[entity]
          ? values
          : { ...values, [idFields[entity]!]: createId(prefixes[entity] || "ID") },
      ),
    }),
  remove: (entity: AdminEntity, id: string) =>
    request<{ id: string; deleted: boolean; deactivated: boolean }>(
      `${entityPath(entity)}/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  updateOrder: (
    orderId: string,
    values: {
      order_status?: string;
      payment_status?: string;
      rider_id?: string;
      note?: string;
    },
  ) =>
    values.order_status
      ? request<AdminRow>(`orders/${encodeURIComponent(orderId)}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: values.order_status, changed_by_type: "admin", note: values.note }),
        })
      : values.payment_status
        ? request<AdminRow>(`orders/${encodeURIComponent(orderId)}/payment`, {
            method: "PATCH",
            body: JSON.stringify({ status: values.payment_status }),
          })
        : request<AdminRow>(`orders/${encodeURIComponent(orderId)}/rider`, {
            method: "PATCH",
            body: JSON.stringify({ rider_id: values.rider_id || null }),
          }),
};
