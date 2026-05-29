export interface DashboardStats {
  totalVerifications: number;
  pendingCases: number;
  completedChecks: number;
  highRiskFlags: number;
  avgProcessingTime: string;
  successRate: number;
  chainVerifications: number;
  aiProcessedChecks: number;
}

export interface TrendData {
  month: string;
  completed: number;
  pending: number;
  flagged: number;
  aiProcessed: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  category: 'auth' | 'verification' | 'admin' | 'system' | 'ai';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'error' | 'success' | 'info' | 'warning';
  isRead: boolean;
  createdAt: string;
}
