import { foodApi } from "./food-api";
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
  restaurants: AdminRow[];
  menu_items: AdminRow[];
  customers: AdminRow[];
  riders: AdminRow[];
  payments: AdminRow[];
}

const adminPost = <T>(adminKey: string, body: Record<string, unknown>) =>
  foodApi.post<T>({ ...body, admin_key: adminKey });

export const adminApi = {
  authenticate: (adminKey: string) =>
    authApi.adminLogin(adminKey),
  snapshot: (adminKey: string) =>
    adminPost<AdminSnapshot>(adminKey, { action: "admin_snapshot" }),
  list: (adminKey: string, entity: AdminEntity, query = "") =>
    adminPost<{ entity: AdminEntity; headers: string[]; rows: AdminRow[] }>(
      adminKey,
      { action: "admin_list", entity, query },
    ),
  upsert: (
    adminKey: string,
    entity: AdminEntity,
    values: AdminRow,
    id?: string,
  ) =>
    adminPost<AdminRow>(adminKey, {
      action: "admin_upsert",
      entity,
      values,
      id,
    }),
  remove: (adminKey: string, entity: AdminEntity, id: string) =>
    adminPost<{ id: string; deleted: boolean; deactivated: boolean }>(
      adminKey,
      { action: "admin_delete", entity, id },
    ),
  updateOrder: (
    adminKey: string,
    orderId: string,
    values: {
      order_status?: string;
      payment_status?: string;
      rider_id?: string;
      note?: string;
    },
  ) =>
    adminPost<AdminRow>(adminKey, {
      action: "admin_update_order",
      order_id: orderId,
      ...values,
    }),
};
