// =====================================================
// MPloyChek - Type Definitions
// Enterprise-grade TypeScript interfaces
// =====================================================

// ---- Auth Types ----
export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface AuthToken {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ---- Verification Types ----
export type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'flagged';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type VerificationType = 'identity' | 'employment' | 'education' | 'criminal' | 'credit' | 'reference' | 'address';

export interface VerificationRecord {
  id: string;
  verificationId: string;
  candidateName: string;
  company: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  riskLevel: RiskLevel;
  submittedDate: string;
  completionEta?: string;
  assigneeId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Activity Types ----
export type ActivityCategory = 'auth' | 'verification' | 'admin' | 'system' | 'general';

export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  details?: string;
  category: ActivityCategory;
  createdAt: string;
}

// ---- Notification Types ----
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

// ---- Dashboard Types ----
export interface DashboardStats {
  totalVerifications: number;
  pendingCases: number;
  completedChecks: number;
  highRiskFlags: number;
  avgProcessingTime: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  category?: string;
}

export interface VerificationTrend {
  month: string;
  completed: number;
  pending: number;
  flagged: number;
}

// ---- App Navigation Types ----
export type AppView = 'dashboard' | 'records' | 'admin' | 'activity' | 'notifications' | 'settings';

export interface NavItem {
  id: AppView;
  label: string;
  icon: string;
  badge?: number;
  adminOnly?: boolean;
}

// ---- API Types ----
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// ---- User Management Types ----
export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}
