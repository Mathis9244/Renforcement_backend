export type Role =
  | "admin"
  | "gestionnaire_portefeuille"
  | "charge_suivi"
  | "charge_clientele"
  | "assure";

export type ApiUser = {
  id: number;
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  role: Role;
  isActive: boolean;
  twoFactorEnabled: boolean;
};

export type LoginResponse = {
  token?: string | null;
  twoFactorRequired?: boolean | null;
  message?: string | null;
  user?: ApiUser;
};

export class ApiError extends Error {
  status: number;
  payload: any;
  constructor(message: string, status: number, payload: any) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function getBaseUrl() {
  // Android emulator: 10.0.2.2 points to host loopback
  return process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:3000";
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(path: string, init?: RequestInit & { token?: string | null }): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (init?.token) headers.set("Authorization", `Bearer ${init.token}`);

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || res.statusText;
    throw new ApiError(String(msg), res.status, data);
  }
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};

