export const FOOD_API_URL =
  "http://localhost:3000/api";

export class FoodApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "FoodApiError";
    this.code = code;
  }
}

export interface ApiRestaurant {
  restaurant_id: string;
  category_id: string;
  category: string;
  name: string;
  rating: number;
  image_url: string;
  is_popular: boolean;
  delivery_min_minutes: number;
  delivery_max_minutes: number;
  delivery_time: string;
  distance_km: number;
  is_active: boolean;
}

export interface ApiCustomizationOption {
  option_id: string;
  group_id: string;
  name: string;
  extra_price: number;
  sort_order: number;
  is_active: boolean;
}

export interface ApiCustomizationGroup {
  group_id: string;
  menu_item_id: string;
  title: string;
  selection_type: "radio" | "checkbox";
  is_required: boolean;
  min_select: number;
  max_select: number;
  options: ApiCustomizationOption[];
}

export interface ApiMenuItem {
  menu_item_id: string;
  restaurant_id: string;
  name: string;
  category: string;
  base_price: number;
  rating: number;
  image_url: string;
  is_popular: boolean;
  is_available: boolean;
  customization_groups: ApiCustomizationGroup[];
}

export interface ApiOrder {
  order_id: string;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_id: string;
  payment_status: string;
  order_status: "received" | "preparing" | "delivering" | "delivered" | "cancelled";
  ordered_at: string;
}

const getJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(url, { redirect: "follow", ...init });
  } catch {
    throw new FoodApiError(
      "ไม่สามารถเชื่อมต่อ Food API ที่ http://localhost:3000 ได้",
      "API_UNREACHABLE",
    );
  }
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new FoodApiError(
      `Food API ตอบกลับด้วยข้อมูลที่ไม่ใช่ JSON (${response.status})`,
      "INVALID_API_RESPONSE",
    );
  }

  const payload = (await response.json()) as T & {
    message?: string | string[];
    error?: string;
  };
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message;
    throw new FoodApiError(
      message || payload.error || `Food API error (${response.status})`,
      String(response.status),
    );
  }
  return payload;
};

const jsonRequest = (method: "POST" | "PATCH", body: Record<string, unknown>) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const createId = (prefix: string) =>
  `${prefix}${crypto.randomUUID().replaceAll("-", "")}`.slice(0, 16);

export const foodApi = {
  restaurants: () =>
    getJson<ApiRestaurant[]>(`${FOOD_API_URL}/restaurants`),
  restaurant: async (restaurantId: string) => {
    const detail = await getJson<ApiRestaurant & { menu_items: ApiMenuItem[] }>(
      `${FOOD_API_URL}/restaurants/${encodeURIComponent(restaurantId)}`,
    );
    const menu = await Promise.all(
      detail.menu_items.map((item) =>
        getJson<ApiMenuItem>(
          `${FOOD_API_URL}/menu-items/${encodeURIComponent(item.menu_item_id)}`,
        ),
      ),
    );
    const { menu_items: _menuItems, ...restaurant } = detail;
    return { restaurant, menu };
  },
  menu: (restaurantId: string) =>
    getJson<ApiMenuItem[]>(
      `${FOOD_API_URL}/menu-items?restaurant_id=${encodeURIComponent(restaurantId)}`,
    ),
  order: (orderId: string) =>
    getJson<Record<string, unknown>>(
      `${FOOD_API_URL}/orders/${encodeURIComponent(orderId)}`,
    ),
  post: <T>(body: Record<string, unknown>) => {
    const { action, ...data } = body;
    if (action === "create_customer")
      return getJson<T>(`${FOOD_API_URL}/customers`, jsonRequest("POST", data));
    if (action === "save_address")
      return getJson<T>(`${FOOD_API_URL}/addresses`, jsonRequest("POST", data));
    if (action === "create_order")
      return getJson<T>(`${FOOD_API_URL}/orders`, jsonRequest("POST", data));
    if (action === "update_payment_status") {
      const { order_id, ...payment } = data;
      return getJson<T>(
        `${FOOD_API_URL}/orders/${encodeURIComponent(String(order_id))}/payment`,
        jsonRequest("PATCH", payment),
      );
    }
    return Promise.reject(
      new FoodApiError(`API action ไม่รองรับ: ${String(action)}`),
    );
  },
};

export async function ensureGuestCustomer(address: string) {
  let savedCustomerId = localStorage.getItem("foodApiCustomerId");
  let savedAddressId = localStorage.getItem(`foodApiAddress:${address}`);
  if ((savedCustomerId?.length ?? 0) > 16 || (savedAddressId?.length ?? 0) > 16) {
    localStorage.removeItem("foodApiCustomerId");
    localStorage.removeItem(`foodApiAddress:${address}`);
    savedCustomerId = null;
    savedAddressId = null;
  }
  if (savedCustomerId && savedAddressId) {
    return { customerId: savedCustomerId, addressId: savedAddressId };
  }

  const customerId = savedCustomerId;
  const phone = localStorage.getItem("foodApiGuestPhone");
  if (!customerId || !phone) {
    throw new FoodApiError("กรุณาเข้าสู่ระบบก่อนสั่งอาหาร", "AUTH_REQUIRED");
  }

  const savedAddress = await foodApi.post<{ address_id: string }>({
    action: "save_address",
    address_id: createId("ADR"),
    customer_id: customerId,
    label: "ที่อยู่จัดส่ง",
    recipient_name: "ลูกค้าออนไลน์",
    phone,
    address_line: address,
    province: "กรุงเทพมหานคร",
    is_default: true,
  });
  localStorage.setItem(`foodApiAddress:${address}`, savedAddress.address_id);
  return { customerId, addressId: savedAddress.address_id };
}
