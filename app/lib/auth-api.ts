import { FOOD_API_URL, FoodApiError } from "./food-api";

export interface UserLoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: {
    customer_id: string;
    full_name: string;
    phone: string;
    email: string | null;
  };
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  admin: { role: "admin" };
}

async function login<T>(path: string, body: Record<string, string>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${FOOD_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new FoodApiError("ไม่สามารถเชื่อมต่อระบบเข้าสู่ระบบได้", "API_UNREACHABLE");
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
      message || payload.error || "เข้าสู่ระบบไม่สำเร็จ",
      String(response.status),
    );
  }
  return payload;
}

export const authApi = {
  userLogin: (phone: string) =>
    login<UserLoginResponse>("/auth/user/login", { phone }),
  adminLogin: (adminKey: string) =>
    login<AdminLoginResponse>("/auth/admin/login", { admin_key: adminKey }),
};
