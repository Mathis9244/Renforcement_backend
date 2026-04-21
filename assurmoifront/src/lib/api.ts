export type Role =
  | 'admin'
  | 'gestionnaire_portefeuille'
  | 'charge_suivi'
  | 'charge_clientele'
  | 'assure';

export type User = {
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
  user?: User;
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
  status: 'draft' | 'complete';
  createdById?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CaseFile = {
  id: number;
  caseNumber: string;
  claimId: number;
  scenario: 'reparable' | 'total_loss';
  currentState: string;
  assignedToId?: number | null;
  createdById?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Approval = {
  id: number;
  caseFileId: number;
  stepKey: string;
  requesterId?: number | null;
  approverId?: number | null;
  status: 'pending' | 'approved' | 'rejected';
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

const TOKEN_KEY = 'assurmoi.jwt';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

function getBaseUrl() {
  const env = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (env && env.trim().length) return env.replace(/\/+$/, '');
  return '';
}

export class ApiError extends Error {
  status: number;
  payload: any;
  constructor(message: string, status: number, payload: any) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const token = getToken();
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || res.statusText;
    throw new ApiError(String(msg), res.status, data);
  }
  return data as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  listClaims: () => request<{ claims: Claim[] }>('/api/v1/claims'),
  createClaim: (payload: Omit<Claim, 'id' | 'status'> & Partial<Pick<Claim, 'liabilityPercent' | 'status'>>) =>
    request<{ claim: Claim }>('/api/v1/claims', { method: 'POST', body: JSON.stringify(payload) }),

  addDocument: (claimId: number, payload: { docType: string; fileUrl: string; caseFileId?: number | null }) =>
    request<{ document: any }>(`/api/v1/claims/${claimId}/documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  completeClaim: (claimId: number, payload: { scenario: 'reparable' | 'total_loss'; assignedToId?: number | null }) =>
    request<{ claim: Claim; caseFile: CaseFile }>(`/api/v1/claims/${claimId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listCaseFiles: () => request<{ caseFiles: CaseFile[] }>('/api/v1/case-files'),
  transitionCaseFile: (id: number, payload: { toState: string; comment?: string }) =>
    request<any>(`/api/v1/case-files/${id}/transition`, { method: 'POST', body: JSON.stringify(payload) }),

  listPendingApprovals: () => request<{ approvals: Approval[] }>('/api/v1/approvals/pending'),
  decideApproval: (id: number, decision: 'approved' | 'rejected') =>
    request<any>(`/api/v1/approvals/${id}/decide`, { method: 'PATCH', body: JSON.stringify({ decision }) }),

  listAuditLogs: (limit = 50) => request<{ logs: AuditLog[] }>(`/api/v1/audit/logs?limit=${limit}`),
};

