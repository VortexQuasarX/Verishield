import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LiveIDVerification } from '../../models/verification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-liveid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liveid.component.html',
  styleUrl: './liveid.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveIdComponent implements OnInit, OnDestroy {
  currentStep = 0; // 0: Capture, 1: Analyze, 2: Result
  steps = ['Capture', 'Analyze', 'Result'];
  analyzing = false;
  verificationResult: LiveIDVerification | null = null;
  verifications: LiveIDVerification[] = [];
  loading = true;

  mockResult: LiveIDVerification = {
    id: 'lid-' + Date.now(),
    candidateName: 'Current Session',
    matchScore: 94,
    livenessScore: 98,
    status: 'verified',
    createdAt: new Date().toISOString(),
  };

  private sub = new Subscription();

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadVerifications();
    }, 0);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadVerifications(): void {
    this.loading = true;
    this.sub.add(
      this.apiService.getLiveIdVerifications().subscribe({
        next: (data) => {
          this.verifications = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.verifications = [
            { id: 'lid-001', candidateName: 'Rahul Sharma', matchScore: 96, livenessScore: 99, status: 'verified', createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: 'lid-002', candidateName: 'Priya Mehta', matchScore: 72, livenessScore: 45, status: 'failed', createdAt: new Date(Date.now() - 43200000).toISOString() },
            { id: 'lid-003', candidateName: 'Amit Kumar', matchScore: 91, livenessScore: 95, status: 'verified', createdAt: new Date(Date.now() - 7200000).toISOString() },
          ];
          this.loading = false;
          this.cdr.markForCheck();
        },
      })
    );
  }

  startVerification(): void {
    this.currentStep = 1;
    this.analyzing = true;

    this.sub.add(
      this.apiService.liveIdAnalyze({}).subscribe({
        next: (result) => {
          this.verificationResult = result;
          this.currentStep = 2;
          this.analyzing = false;
          this.loadVerifications();
          this.cdr.markForCheck();
        },
        error: () => {
          this.verificationResult = this.mockResult;
          this.currentStep = 2;
          this.analyzing = false;
          this.cdr.markForCheck();
        },
      })
    );
  }

  resetVerification(): void {
    this.currentStep = 0;
    this.verificationResult = null;
    this.analyzing = false;
  }

  getScoreColor(score: number): string {
    if (score >= 85) return 'var(--accent-green)';
    if (score >= 60) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  }

  getScoreClass(score: number): string {
    if (score >= 85) return 'low';
    if (score >= 60) return 'medium';
    return 'critical';
  }

  getStatusBadgeClass(status: string): string {
    return `badge badge-${status === 'verified' ? 'completed' : status}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
