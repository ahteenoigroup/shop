export const FOOD_API_URL =
  "https://script.google.com/macros/s/AKfycbz7r063tTjIsp8ceKZwgKKi37m9MaOe-zxNxIon0TjHZqhIxaaWnw1EeJAh7HKTzOSP/exec";

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; status?: number };
};

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
      "เชื่อมต่อ Google Apps Script ไม่สำเร็จ กรุณาตั้งค่า Web App เป็น Who has access: Anyone",
      "API_UNREACHABLE",
    );
  }
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new FoodApiError(
      "API ยังไม่เปิดสิทธิ์สาธารณะ กรุณา Deploy Web App โดยเลือก Who has access: Anyone",
      "API_NOT_PUBLIC",
    );
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.ok || payload.data === undefined) {
    throw new FoodApiError(
      payload.error?.message || "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
      payload.error?.code,
    );
  }
  return payload.data;
};

export const foodApi = {
  restaurants: () =>
    getJson<ApiRestaurant[]>(`${FOOD_API_URL}?resource=restaurants`),
  restaurant: (restaurantId: string) =>
    getJson<{ restaurant: ApiRestaurant; menu: ApiMenuItem[] }>(
      `${FOOD_API_URL}?resource=restaurant&id=${encodeURIComponent(restaurantId)}`,
    ),
  menu: (restaurantId: string) =>
    getJson<ApiMenuItem[]>(
      `${FOOD_API_URL}?resource=menu&restaurant_id=${encodeURIComponent(restaurantId)}`,
    ),
  order: (orderId: string) =>
    getJson<Record<string, unknown>>(
      `${FOOD_API_URL}?resource=order&order_id=${encodeURIComponent(orderId)}`,
    ),
  post: <T>(body: Record<string, unknown>) =>
    getJson<T>(FOOD_API_URL, {
      method: "POST",
      // Apps Script Web Apps do not handle browser CORS preflight requests.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    }),
};

export async function ensureGuestCustomer(address: string) {
  const savedCustomerId = localStorage.getItem("foodApiCustomerId");
  const savedAddressId = localStorage.getItem(`foodApiAddress:${address}`);
  if (savedCustomerId && savedAddressId) {
    return { customerId: savedCustomerId, addressId: savedAddressId };
  }

  let customerId = savedCustomerId;
  let phone = localStorage.getItem("foodApiGuestPhone");
  if (!phone) {
    phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
    localStorage.setItem("foodApiGuestPhone", phone);
  }

  if (!customerId) {
    const customer = await foodApi.post<{ customer_id: string }>({
      action: "create_customer",
      full_name: "ลูกค้าออนไลน์",
      phone,
    });
    customerId = customer.customer_id;
    localStorage.setItem("foodApiCustomerId", customerId);
  }

  const savedAddress = await foodApi.post<{ address_id: string }>({
    action: "save_address",
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
