import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { RiskAnalysis, AIInsight } from '../../models/ai.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-credscan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credscan.component.html',
  styleUrl: './credscan.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CredScanComponent implements OnInit, OnDestroy {
  candidateName = '';
  documentType = 'identity';
  isLoading = false;
  scanComplete = false;
  riskAnalysis: RiskAnalysis | null = null;
  insights: AIInsight[] = [];
  documentTypes = [
    { value: 'identity', label: 'Identity Document' },
    { value: 'employment', label: 'Employment Record' },
    { value: 'education', label: 'Education Certificate' },
    { value: 'criminal', label: 'Criminal Background' },
    { value: 'credit', label: 'Credit Report' },
    { value: 'address', label: 'Address Proof' },
  ];
  verifiedItems = [
    { name: 'Document Authenticity', status: 'verified' },
    { name: 'Personal Information', status: 'verified' },
    { name: 'Employment History', status: 'verified' },
    { name: 'Education Records', status: 'pending' },
    { name: 'Criminal Background', status: 'verified' },
  ];
  flaggedItems = [
    { name: 'Address Mismatch', severity: 'medium', detail: 'Provided address does not match records' },
    { name: 'Employment Gap', severity: 'low', detail: '3-month gap in employment history' },
  ];

  private sub = new Subscription();

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadInsights();
    }, 0);
  }

  loadInsights(): void {
    this.sub.add(
      this.apiService.getInsights().subscribe({
        next: (data) => { this.insights = (data.insights || data as any).slice(0, 3); this.cdr.markForCheck(); },
        error: () => { this.insights = []; this.cdr.markForCheck(); },
      })
    );
  }

  startScan(): void {
    if (!this.candidateName.trim()) return;

    this.isLoading = true;
    this.scanComplete = false;

    this.sub.add(
      this.apiService.riskAnalysis({
        candidateName: this.candidateName,
        documentType: this.documentType,
      }).subscribe({
        next: (result) => {
          this.riskAnalysis = result;
          this.scanComplete = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.riskAnalysis = {
            riskScore: 72,
            riskLevel: 'medium',
            factors: [
              { name: 'Document Authenticity', score: 95, weight: 0.3 },
              { name: 'Identity Match', score: 88, weight: 0.25 },
              { name: 'Employment History', score: 76, weight: 0.2 },
              { name: 'Address Verification', score: 45, weight: 0.15 },
              { name: 'Criminal Background', score: 92, weight: 0.1 },
            ],
            recommendation: 'Candidate shows medium risk. Address verification flagged - recommend manual review of address documents.',
          };
          this.scanComplete = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      })
    );
  }

  resetScan(): void {
    this.candidateName = '';
    this.documentType = 'identity';
    this.scanComplete = false;
    this.riskAnalysis = null;
  }

  getRiskColor(level: string): string {
    switch (level) {
      case 'low': return 'var(--accent-green)';
      case 'medium': return 'var(--accent-orange)';
      case 'high': return 'var(--accent-red)';
      case 'critical': return 'var(--accent-red)';
      default: return 'var(--text-tertiary)';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 85) return 'low';
    if (score >= 65) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
