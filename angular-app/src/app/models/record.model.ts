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
  assigneeId?: string;
  notes?: string;
  progress: number;
  chainHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordsResponse {
  data: VerificationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  accessLevel: 'full' | 'limited';
}

export interface RecordsQueryParams {
  delay?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  riskLevel?: string;
  verificationType?: string;
  sort?: string;
  sortDir?: string;
}

export interface CreateRecordRequest {
  candidateName: string;
  company: string;
  verificationType: string;
  assigneeId?: string;
}
