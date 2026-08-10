const configuredApiUrl = import.meta.env.VITE_FOOD_API_URL?.trim();

export const API_URL = (configuredApiUrl || "http://localhost:3000/api").replace(
  /\/$/,
  "",
);

if (
  import.meta.env.PROD &&
  API_URL.startsWith("http://") &&
  !API_URL.startsWith("http://localhost")
) {
  throw new Error("VITE_FOOD_API_URL must use HTTPS in production");
}

export type AuthScope = "none" | "user" | "admin";

const TOKEN_KEYS: Record<Exclude<AuthScope, "none">, string> = {
  user: "foodApiAccessToken",
  admin: "adminAccessToken",
};

type ErrorPayload = {
  message?: string | string[];
  error?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function tokenStorage(scope: Exclude<AuthScope, "none">): Storage {
  return scope === "admin" ? sessionStorage : localStorage;
}

export function saveAccessToken(
  scope: Exclude<AuthScope, "none">,
  token: string,
) {
  tokenStorage(scope).setItem(TOKEN_KEYS[scope], token);
}

export function getAccessToken(scope: Exclude<AuthScope, "none">) {
  return tokenStorage(scope).getItem(TOKEN_KEYS[scope]);
}

export function removeAccessToken(scope: Exclude<AuthScope, "none">) {
  tokenStorage(scope).removeItem(TOKEN_KEYS[scope]);
}

function errorMessage(payload: ErrorPayload | undefined, fallback: string) {
  const message = payload?.message;
  return Array.isArray(message) ? message.join(", ") : message || payload?.error || fallback;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  scope: AuthScope = "none",
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  const token = scope === "none" ? null : getAccessToken(scope);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    const isJson = response.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json");
    const payload = isJson
      ? ((await response.json()) as T & ErrorPayload)
      : undefined;

    if (!response.ok) {
      if (response.status === 401 && scope !== "none") removeAccessToken(scope);
      throw new ApiError(
        errorMessage(payload, `API error (${response.status})`),
        String(response.status),
      );
    }

    if (response.status === 204) return undefined as T;
    if (!payload) {
      throw new ApiError("API ตอบกลับด้วยข้อมูลที่ไม่ใช่ JSON", "INVALID_API_RESPONSE");
    }
    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("การเชื่อมต่อ API ใช้เวลานานเกินไป", "API_TIMEOUT");
    }
    throw new ApiError("ไม่สามารถเชื่อมต่อ API ได้", "API_UNREACHABLE");
  } finally {
    window.clearTimeout(timeout);
  }
}
