// =====================================================
// VeriShield Pro - Comprehensive Type Definitions
// =====================================================

// ---- Auth ----
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: string;
  avatar?: string;
}

export interface AuthToken {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ---- Verification Records ----
export interface VerificationRecord {
  id: string;
  verificationId: string;
  candidateName: string;
  company: string;
  verificationType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'flagged';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  submittedDate: string;
  completionEta?: string;
  assigneeId?: string | null;
  notes?: string | null;
  progress: number;
  chainHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  accessLevel: 'full' | 'limited';
}

// ---- Dashboard ----
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

export interface VerificationTrend {
  month: string;
  completed: number;
  pending: number;
  flagged: number;
  aiProcessed: number;
}

export interface PipelineStage {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

// ---- Notifications ----
export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}

// ---- Activity ----
export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  details?: string;
  category: string;
  createdAt: string;
}

// ---- AI Products ----
export interface CredScanResult {
  overallRiskScore: number;
  riskLevel: string;
  riskFactors: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    confidence: number;
  }>;
  recommendations: string[];
  summary: string;
  analyzedAt: string;
}

export interface ForensiDocResult {
  documentType: string;
  extractedText: string;
  extractedFields: Array<{ label: string; value: string }>;
  forgeryIndicators: string[];
  authenticityScore: number;
  assessment: string;
}

export interface NexusResult {
  action: string;
  result: Record<string, unknown>;
  generatedAt: string;
}

export interface LiveIDResult {
  faceDetected: boolean;
  qualityScore: number;
  livenessScore: number;
  antiSpoofScore: number;
  faceMatchScore: number;
  assessment: string;
}

export interface ChatVerifyMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface DeepGuardResult {
  faceDetected: boolean;
  faceCount: number;
  livenessScore: number;
  deepfakeProbability: number;
  anomalies: string[];
  assessment: string;
}

export interface ChainBlock {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  data: string;
  nonce: number;
  verificationId?: string;
}

export interface ChainSealResult {
  id: string;
  hash: string;
  blockHash: string;
  recordType: string;
  sealedAt: string;
  verified: boolean;
  previousHash: string;
}

// ---- Users (Admin) ----
export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

// ---- Navigation ----
export type AppView =
  | 'landing'
  | 'login'
  | 'dashboard'
  | 'records'
  | 'credscan'
  | 'forensidoc'
  | 'nexus'
  | 'liveid'
  | 'chatverify'
  | 'deepguard'
  | 'chainseal'
  | 'admin'
  | 'settings';
