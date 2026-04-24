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

export type ForgotPasswordResponse = {
  message: string;
  resetToken?: string | null;
};

export type Claim = {
  id: number;
  vehicleRegistration: string;
  driverFirstName: string;
  driverLastName: string;
  driverIsInsured: boolean;
  callAt: string;
  accidentAt: string;
  contextText: string;
  liabilityAccepted: boolean;
  liabilityPercent: number;
  status: "draft" | "complete";
  createdById?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CaseFile = {
  id: number;
  caseNumber: string;
  claimId: number;
  scenario: "reparable" | "total_loss";
  currentState: string;
  assignedToId?: number | null;
  createdById?: number | null;
  expertisePlannedAt?: string | null;
  expertiseDoneAt?: string | null;
  expertiseReportUrl?: string | null;
  expertiseDiagnostic?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Approval = {
  id: number;
  caseFileId: number;
  stepKey: string;
  requesterId?: number | null;
  approverId?: number | null;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
};

export type AuditLog = {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  userId?: number | null;
  metadata?: string | null;
  createdAt: string;
  user?: { id: number; username: string; role: Role };
};

export type UserCreateRequest = {
  username: string;
  password: string;
  email?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  role?: Role;
  isActive?: boolean;
};

export type UserUpdateRequest = Partial<{
  password: string | null;
  email: string | null;
  firstname: string | null;
  lastname: string | null;
  role: Role;
  isActive: boolean;
  twoFactorEnabled: boolean;
}>;

import { Platform } from "react-native";

export class ApiError extends Error {
  status: number;
  payload: any;
  constructor(message: string, status: number, payload: any) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export function getBaseUrl() {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (env && env.trim().length) return env.replace(/\/+$/, "");

  // Sensible defaults per platform:
  // - android emulator: 10.0.2.2 points to host loopback
  // - web: use localhost
  // - ios device: must set EXPO_PUBLIC_API_BASE_URL to your PC IP (LAN) or a tunnel
  const base =
    Platform.OS === "android"
      ? "http://10.0.2.2:3000"
      : "http://localhost:3000";
  return base.replace(/\/+$/, "");
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
  // Only set JSON content-type when body is JSON string.
  // For FormData (multipart), let fetch set the boundary automatically.
  if (typeof init?.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (init?.token) headers.set("Authorization", `Bearer ${init.token}`);

  const controller = new AbortController();
  const timeoutMs = 12000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new ApiError(`Request timed out after ${timeoutMs}ms (API: ${getBaseUrl()})`, 0, null);
    }
    throw new ApiError(e?.message || "Network error", 0, null);
  } finally {
    clearTimeout(timeout);
  }
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

  forgotPassword: (email: string) =>
    request<ForgotPasswordResponse>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  listClaims: (token: string) => request<{ claims: Claim[] }>("/api/v1/claims", { token }),
  getClaim: (token: string, id: number) => request<{ claim: Claim }>(`/api/v1/claims/${id}`, { token }),
  createClaim: (
    token: string,
    payload: Omit<Claim, "id" | "status"> & Partial<Pick<Claim, "liabilityPercent" | "status">>
  ) => request<{ claim: Claim }>("/api/v1/claims", { method: "POST", body: JSON.stringify(payload), token }),

  addDocument: (
    token: string,
    claimId: number,
    payload:
      | { docType: string; fileUrl: string; caseFileId?: number | null }
      | { docType: string; file: { uri: string; name: string; type?: string }; caseFileId?: number | null }
  ) => {
    if ("file" in payload) {
      const form = new FormData();
      form.append("docType", payload.docType);
      if (payload.caseFileId != null) form.append("caseFileId", String(payload.caseFileId));
      form.append("file", {
        uri: payload.file.uri,
        name: payload.file.name,
        type: payload.file.type || "application/octet-stream",
      } as any);
      return request<{ document: any }>(`/api/v1/claims/${claimId}/documents`, { method: "POST", body: form as any, token });
    }
    return request<{ document: any }>(`/api/v1/claims/${claimId}/documents`, { method: "POST", body: JSON.stringify(payload), token });
  },

  validateDocument: (token: string, documentId: number, status: "approved" | "rejected") =>
    request<{ document: any }>(`/api/v1/documents/${documentId}/validate`, { method: "PATCH", body: JSON.stringify({ status }), token }),

  completeClaim: (token: string, claimId: number, payload: { scenario: "reparable" | "total_loss"; assignedToId?: number | null }) =>
    request<{ claim: Claim; caseFile: CaseFile }>(`/api/v1/claims/${claimId}/complete`, { method: "POST", body: JSON.stringify(payload), token }),

  listCaseFiles: (token: string) => request<{ caseFiles: CaseFile[] }>("/api/v1/case-files", { token }),
  transitionCaseFile: (
    token: string,
    id: number,
    payload: {
      toState: string;
      comment?: string;
      expertisePlannedAt?: string;
      expertiseDoneAt?: string;
      expertiseReportUrl?: string;
      expertiseDiagnostic?: string;
    }
  ) => request<any>(`/api/v1/case-files/${id}/transition`, { method: "POST", body: JSON.stringify(payload), token }),

  listPendingApprovals: (token: string) => request<{ approvals: Approval[] }>("/api/v1/approvals/pending", { token }),
  decideApproval: (token: string, id: number, decision: "approved" | "rejected") =>
    request<any>(`/api/v1/approvals/${id}/decide`, { method: "PATCH", body: JSON.stringify({ decision }), token }),

  listAuditLogs: (token: string, limit = 50) => request<{ logs: AuditLog[] }>(`/api/v1/audit/logs?limit=${limit}`, { token }),

  listUsers: (token: string) => request<{ users: ApiUser[] }>("/user", { token }),
  createUser: (token: string, payload: UserCreateRequest) =>
    request<{ user: ApiUser }>("/user", { method: "POST", body: JSON.stringify(payload), token }),
  updateUser: (token: string, id: number, payload: UserUpdateRequest) =>
    request<{ user: ApiUser }>(`/user/${id}`, { method: "PUT", body: JSON.stringify(payload), token }),
  deactivateUser: (token: string, id: number) => request<{ message: string }>(`/user/${id}`, { method: "DELETE", token }),
};

