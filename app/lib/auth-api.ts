import { apiRequest, removeAccessToken } from "./api-client";

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
  return apiRequest<T>(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "none",
  );
}

export const authApi = {
  userLogin: (phone: string, password: string) =>
    login<UserLoginResponse>("/auth/user/login", { phone, password }),
  adminLogin: (adminKey: string) =>
    login<AdminLoginResponse>("/auth/admin/login", { admin_key: adminKey }),
  logoutUser: () => {
    removeAccessToken("user");
    localStorage.removeItem("foodApiCustomerId");
    localStorage.removeItem("foodApiGuestPhone");
    localStorage.removeItem("foodApiUser");
    localStorage.removeItem("deliveryCart");
    localStorage.removeItem("deliveryHistory");
    Object.keys(localStorage)
      .filter((key) => key.startsWith("foodApiAddress:"))
      .forEach((key) => localStorage.removeItem(key));
  },
};
