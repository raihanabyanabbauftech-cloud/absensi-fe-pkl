import { getSession } from "next-auth/react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

const ACCESS_TOKEN_KEY = "sams_access_token";

export function storeAccessToken(token?: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getApiToken(): Promise<string | null> {
  try {
    const session = await getSession();
    if (session?.user?.accessToken) {
      return session.user.accessToken as string;
    }
  } catch {
    // fall through to stored token
  }
  return getStoredAccessToken();
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    detail?: Record<string, unknown>;
  };
}

export     class ApiError extends Error {
  code: string;
  detail?: Record<string, unknown>;

  constructor(code: string, message: string, detail?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.detail = detail;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let accessToken: string | null = null;
  try {
    const session = await getSession();
    accessToken = session?.user?.accessToken ?? null;
  } catch {
    accessToken = null;
  }
  if (!accessToken) accessToken = getStoredAccessToken();

  const safeEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${safeEndpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      "NETWORK_ERROR",
      `Tidak dapat terhubung ke backend. Pastikan server backend berjalan di ${API_URL}.`,
    );
  }

  const text = await response.text();

  let json: ApiResponse<T> | null = null;
  try {
    json = JSON.parse(text) as ApiResponse<T>;
  } catch {
    json = null;
  }

  if (!response.ok || !json || !json.success) {
    throw new ApiError(
      json?.error?.code || "UNKNOWN_ERROR",
      json?.error?.message ||
        `Server returned HTTP ${response.status}. Check that the endpoint exists and the backend is running.`,
      json?.error?.detail,
    );
  }

  return json.data;
}
