// =====================================================
// VeriShield - Records Service
// Service layer for verification records operations
// Handles data fetching, filtering, pagination
// =====================================================

import { recordsApi } from '@/lib/api';
import type { VerificationRecord, VerificationStatus, RiskLevel } from '@/types';

export interface RecordsQuery {
  delay?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: VerificationStatus;
  riskLevel?: RiskLevel;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
}

export interface RecordsResult {
  records: VerificationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  accessLevel: 'full' | 'limited';
}

/**
 * RecordsService - Handles verification records operations
 * 
 * Architecture Pattern: Service Layer
 * - Encapsulates records API communication
 * - Manages query parameter construction
 * - Transforms API responses
 * - Provides access level information
 */
export const RecordsService = {
  /**
   * Fetch records with query parameters
   */
  async getRecords(query: RecordsQuery = {}): Promise<RecordsResult> {
    const response = await recordsApi.getAll({
      delay: query.delay,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
      search: query.search || undefined,
      status: query.status || undefined,
      riskLevel: query.riskLevel || undefined,
      sort: query.sortField || 'submittedDate',
      sortDir: query.sortDir || 'desc',
    });

    return {
      records: response.data,
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
      accessLevel: ('accessLevel' in response ? (response as Record<string, unknown>).accessLevel : 'limited') as 'full' | 'limited',
    };
  },

  /**
   * Get human-readable status label
   */
  getStatusLabel(status: VerificationStatus): string {
    const labels: Record<VerificationStatus, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      failed: 'Failed',
      flagged: 'Flagged',
    };
    return labels[status] || status;
  },

  /**
   * Get human-readable verification type
   */
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      identity: 'Identity',
      employment: 'Employment',
      education: 'Education',
      criminal: 'Criminal',
      credit: 'Credit',
      reference: 'Reference',
      address: 'Address',
    };
    return labels[type] || type;
  },

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  },
};
