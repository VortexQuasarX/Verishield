// =====================================================
// VeriShield - API Client
// Centralized API layer with auth, retry, and delay support
// =====================================================

import type {
  AuthToken,
  LoginCredentials,
  VerificationRecord,
  AuthUser,
  ActivityLog,
  AppNotification,
  DashboardStats,
  VerificationTrend,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedResponse,
} from '@/types';

const API_BASE = '/api';

// ---- Token Management ----
const TOKEN_KEY = 'verishield_token';
const USER_KEY = 'verishield_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ---- Generic Fetch with Retry & Auth ----
interface FetchOptions extends RequestInit {
  retryCount?: number;
  retryDelay?: number;
}

async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { retryCount = 2, retryDelay = 1000, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...rest,
        headers,
      });

      if (response.status === 401) {
        clearAuth();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `Request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retryCount && !(error instanceof Error && error.message.includes('Session expired'))) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError;
}

// ---- Auth API ----
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiFetch<AuthToken>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
};

// ---- Records API ----
export const recordsApi = {
  getAll: (params?: { delay?: number; page?: number; pageSize?: number; search?: string; status?: string; verificationType?: string; riskLevel?: string; sort?: string; sortDir?: string }) => {
    const query = new URLSearchParams();
    if (params?.delay) query.set('delay', String(params.delay));
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.verificationType) query.set('verificationType', params.verificationType);
    if (params?.riskLevel) query.set('riskLevel', params.riskLevel);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.sortDir) query.set('sortDir', params.sortDir);
    const qs = query.toString();
    return apiFetch<PaginatedResponse<VerificationRecord>>(`/records${qs ? `?${qs}` : ''}`);
  },
};

// ---- Users API ----
export const usersApi = {
  getAll: (params?: { delay?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.delay) query.set('delay', String(params.delay));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return apiFetch<AuthUser[]>(`/users${qs ? `?${qs}` : ''}`);
  },
  create: (payload: CreateUserPayload) =>
    apiFetch<AuthUser>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdateUserPayload) =>
    apiFetch<AuthUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// ---- Dashboard API ----
export const dashboardApi = {
  getStats: (delay?: number) => {
    const query = delay ? `?delay=${delay}` : '';
    return apiFetch<DashboardStats>(`/dashboard/stats${query}`);
  },
  getTrends: (delay?: number) => {
    const query = delay ? `?delay=${delay}` : '';
    return apiFetch<VerificationTrend[]>(`/dashboard/trends${query}`);
  },
};

// ---- Activity API ----
export const activityApi = {
  getAll: (params?: { delay?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.delay) query.set('delay', String(params.delay));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiFetch<ActivityLog[]>(`/activity${qs ? `?${qs}` : ''}`);
  },
};

// ---- Notifications API ----
export const notificationsApi = {
  getAll: () =>
    apiFetch<AppNotification[]>('/notifications'),
  markRead: (id: string) =>
    apiFetch<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
};

// ---- AI Chat API ----
export const aiChatApi = {
  sendMessage: (message: string, context?: string, conversationHistory?: Array<{role: string; content: string}>) =>
    apiFetch<{ reply: string; response?: string; timestamp: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, conversationHistory }),
    }),
};

// ---- AI Risk Analysis API (CredScan) ----
export const aiRiskApi = {
  analyze: (candidateName: string, verificationData?: Record<string, unknown>) =>
    apiFetch<{
      overallRiskScore: number;
      riskFactors: Array<{ category: string; severity: string; description: string; confidence: number }>;
      recommendations: string[];
      summary?: string;
    }>('/ai/risk-analysis', {
      method: 'POST',
      body: JSON.stringify({ candidateName, verificationData }),
    }),
};

// ---- AI Document Forensics API (ForensiDoc) ----
export const aiForensiDocApi = {
  analyze: (documentImageUrl: string, analysisType?: string) =>
    apiFetch<{
      documentType: string;
      extractedText: string;
      extractedFields: Array<{ label: string; value: string }>;
      forgeryIndicators: string[];
      authenticityScore: number;
    }>('/ai/forensidoc', {
      method: 'POST',
      body: JSON.stringify({ documentImageUrl, analysisType }),
    }),
};

// ---- AI Insights API (Dashboard) ----
export const aiInsightsApi = {
  getInsights: (stats?: Record<string, unknown>) =>
    apiFetch<{
      insights: Array<{ icon: string; text: string; color: string; bg: string; accent: string }>;
    }>('/ai/insights', {
      method: 'POST',
      body: JSON.stringify({ stats }),
    }),
};

// ---- LiveID Analyze API ----
export const liveidAnalyzeApi = {
  analyze: (imageBase64: string) =>
    apiFetch<{
      faceDetected: boolean;
      qualityScore: number;
      livenessScore: number;
      antiSpoofScore: number;
      faceMatchScore: number;
      assessment: string;
    }>('/liveid/analyze', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    }),
};

// ---- DeepGuard Analyze API ----
export const deepguardAnalyzeApi = {
  analyze: (imageBase64: string) =>
    apiFetch<{
      faceDetected: boolean;
      faceCount: number;
      livenessScore: number;
      deepfakeProbability: number;
      anomalies: string[];
      assessment: string;
    }>('/deepguard/analyze', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    }),
};

// ---- ChatVerify Chat API ----
export const chatverifyChatApi = {
  chat: (message: string, conversationHistory: Array<{ role: string; content: string }>) =>
    apiFetch<{ reply: string; timestamp: string }>('/chatverify/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    }),
};

// ---- AI ForensiDoc Analyze API ----
export const aiForensiDocAnalyzeApi = {
  analyze: (documentImageBase64: string, analysisType?: string) =>
    apiFetch<{
      documentType: string;
      extractedText: string;
      extractedFields: Array<{ label: string; value: string }>;
      forgeryIndicators: string[];
      authenticityScore: number;
      assessment: string;
    }>('/ai/forensidoc/analyze', {
      method: 'POST',
      body: JSON.stringify({ documentImageBase64, analysisType }),
    }),
};

// ---- AI Nexus Agent API ----
export const aiNexusApi = {
  predict: (action: string, context?: Record<string, unknown>) =>
    apiFetch<{
      result: Record<string, unknown>;
      message: string;
    }>('/ai/nexus', {
      method: 'POST',
      body: JSON.stringify({ action, context }),
    }),
};

// ---- Settings API ----
export const settingsApi = {
  getAll: () =>
    apiFetch<Record<string, string>>('/settings'),
  update: (settings: Record<string, string>) =>
    apiFetch<Record<string, string>>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

// ---- Escalation API ----
export const escalationApi = {
  check: () =>
    apiFetch<{
      escalated: number;
      message: string;
      autoEscalationEnabled: boolean;
      thresholdHours?: number;
      checkedAt?: string;
    }>('/escalation/check', {
      method: 'POST',
    }),
};
