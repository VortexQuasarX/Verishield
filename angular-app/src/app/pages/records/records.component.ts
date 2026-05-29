import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecordsService } from '../../services/records.service';
import { AuthService } from '../../services/auth.service';
import { VerificationRecord, RecordsResponse, RecordsQueryParams } from '../../models/record.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './records.component.html',
  styleUrl: './records.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsComponent implements OnInit, OnDestroy {
  records: VerificationRecord[] = [];
  totalRecords = 0;
  totalPages = 0;
  accessLevel: 'full' | 'limited' = 'limited';
  loading = true;

  searchQuery = '';
  statusFilter = '';
  riskFilter = '';
  typeFilter = '';
  sortField = 'submittedDate';
  sortDir: 'asc' | 'desc' = 'desc';
  currentPage = 1;
  pageSize = 10;

  showCreateModal = false;
  newRecord = { candidateName: '', company: '', verificationType: '' };
  creatingRecord = false;
  createError = '';

  selectedRecord: VerificationRecord | null = null;
  expandedRow: string | null = null;
  flaggedRecords = new Set<string>();
  copiedId: string | null = null;

  private sub = new Subscription();

  verificationTypes = [
    'identity', 'employment', 'education', 'criminal', 'credit',
    'reference', 'address', 'drug', 'global_database', 'address_validation'
  ];

  constructor(
    private recordsService: RecordsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadRecords(): void {
    this.loading = true;
    const params: RecordsQueryParams = {
      delay: 200,
      page: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchQuery || undefined,
      status: this.statusFilter || undefined,
      riskLevel: this.riskFilter || undefined,
      verificationType: this.typeFilter || undefined,
      sort: this.sortField,
      sortDir: this.sortDir,
    };

    this.sub.add(
      this.recordsService.getRecords(params).subscribe({
        next: (response: RecordsResponse) => {
          this.records = response.data;
          this.totalRecords = response.total;
          this.totalPages = response.totalPages;
          this.accessLevel = response.accessLevel;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      })
    );
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadRecords();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadRecords();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'desc';
    }
    this.loadRecords();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRecords();
    }
  }

  onFirstPage(): void {
    this.onPageChange(1);
  }

  onLastPage(): void {
    this.onPageChange(this.totalPages);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  toggleRow(record: VerificationRecord): void {
    this.expandedRow = this.expandedRow === record.id ? null : record.id;
  }

  isExpanded(record: VerificationRecord): boolean {
    return this.expandedRow === record.id;
  }

  copyVerificationId(record: VerificationRecord, event: Event): void {
    event.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(record.verificationId).then(() => {
        this.copiedId = record.id;
        setTimeout(() => (this.copiedId = null), 2000);
      });
    }
  }

  flagRecord(record: VerificationRecord, event: Event): void {
    event.stopPropagation();
    if (this.flaggedRecords.has(record.id)) {
      this.flaggedRecords.delete(record.id);
    } else {
      this.flaggedRecords.add(record.id);
    }
  }

  isFlagged(record: VerificationRecord): boolean {
    return this.flaggedRecords.has(record.id);
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newRecord = { candidateName: '', company: '', verificationType: '' };
    this.createError = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreateRecord(): void {
    if (!this.newRecord.candidateName || !this.newRecord.company || !this.newRecord.verificationType) {
      this.createError = 'All fields are required.';
      return;
    }

    this.creatingRecord = true;
    this.createError = '';

    this.sub.add(
      this.recordsService.createRecord(this.newRecord).subscribe({
        next: () => {
          this.creatingRecord = false;
          this.showCreateModal = false;
          this.loadRecords();
        },
        error: () => {
          this.creatingRecord = false;
          this.createError = 'Failed to create record. Please try again.';
        },
      })
    );
  }

  viewRecord(record: VerificationRecord): void {
    this.selectedRecord = record;
  }

  closeDetail(): void {
    this.selectedRecord = null;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getStatusBadgeClass(status: string): string {
    return `badge badge-${status}`;
  }

  getRiskBadgeClass(risk: string): string {
    return `badge badge-${risk}`;
  }

  getStatusDotClass(status: string): string {
    return `status-dot status-${status}`;
  }

  getRiskDotClass(risk: string): string {
    return `risk-dot risk-${risk}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getProgressColor(status: string, riskLevel: string): string {
    if (status === 'completed') return '';
    if (status === 'failed' || status === 'flagged') return 'critical';
    if (riskLevel === 'high' || riskLevel === 'critical') return 'critical';
    if (riskLevel === 'medium') return 'medium';
    return 'low';
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '';
    return this.sortDir === 'asc' ? ' \u2191' : ' \u2193';
  }

  getVerificationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      identity: 'Identity',
      employment: 'Employment',
      education: 'Education',
      criminal: 'Criminal',
      credit: 'Credit',
      reference: 'Reference',
      address: 'Address',
      drug: 'Drug Test',
      global_database: 'Global DB',
      address_validation: 'Address Validation',
    };
    return labels[type] || type;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.riskFilter = '';
    this.typeFilter = '';
    this.sortField = 'submittedDate';
    this.sortDir = 'desc';
    this.currentPage = 1;
    this.loadRecords();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.statusFilter || this.riskFilter || this.typeFilter);
  }
}
