import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { DashboardService } from '../../services/dashboard.service';
import { ApiService } from '../../services/api.service';
import { PipelineStage } from '../../models/system.model';
import { AIInsight } from '../../models/ai.model';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../shared/theme.service';
import { DashboardStats, TrendData, ActivityLog, AppNotification } from '../../models/dashboard.model';
import { Subscription } from 'rxjs';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats | null = null;
  trends: TrendData[] = [];
  activities: ActivityLog[] = [];
  notifications: AppNotification[] = [];
  pipelineData: PipelineStage[] = [];
  aiInsights: AIInsight[] = [];
  loading = true;
  trendsLoading = true;
  activitiesLoading = true;

  // API Delay Simulator
  apiDelay = 0;
  delayOptions = [0, 500, 1000, 2000, environment.maxDelay];
  activeRequests = 0;

  private sub = new Subscription();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private apiService: ApiService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadTrends();
    this.loadActivities();
    this.loadNotifications();
    this.loadPipeline();
    this.loadInsights();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ── User Profile Getters ──────────────────────────────────────────

  get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  get userRole(): string {
    return this.authService.isAdmin() ? 'Administrator' : 'General User';
  }

  get userInitials(): string {
    const user = this.currentUser;
    if (!user?.name) return '??';
    const parts = user.name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0).toUpperCase() || '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + last || '??';
  }

  get lastLoginFormatted(): string {
    const user = this.currentUser;
    if (!user?.lastLogin) return 'Just now';
    try {
      const date = new Date(user.lastLogin);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffDays > 0) {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
          ' at ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
      if (diffHrs > 0) return `${diffHrs}h ago`;
      if (diffMin > 0) return `${diffMin}m ago`;
      return 'Just now';
    } catch {
      return 'Just now';
    }
  }

  // ── Data Loading ──────────────────────────────────────────────────

  loadStats(): void {
    this.loading = true;
    this.activeRequests++;
    this.sub.add(
      this.dashboardService.getStats(this.apiDelay).subscribe({
        next: (data) => {
          this.stats = data;
          this.loading = false;
          this.activeRequests--;
        },
        error: () => {
          this.loading = false;
          this.activeRequests--;
        },
      })
    );
  }

  loadTrends(): void {
    this.trendsLoading = true;
    this.activeRequests++;
    this.sub.add(
      this.dashboardService.getTrends(this.apiDelay).subscribe({
        next: (data) => {
          this.trends = data;
          this.trendsLoading = false;
          this.activeRequests--;
        },
        error: () => {
          this.trendsLoading = false;
          this.activeRequests--;
        },
      })
    );
  }

  loadActivities(): void {
    this.activitiesLoading = true;
    this.activeRequests++;
    this.sub.add(
      this.dashboardService.getActivity(this.apiDelay, 8).subscribe({
        next: (data) => {
          this.activities = data;
          this.activitiesLoading = false;
          this.activeRequests--;
        },
        error: () => {
          this.activitiesLoading = false;
          this.activeRequests--;
        },
      })
    );
  }

  loadNotifications(): void {
    this.sub.add(
      this.dashboardService.getNotifications().subscribe({
        next: (data) => (this.notifications = data),
        error: () => (this.notifications = []),
      })
    );
  }

  loadPipeline(): void {
    this.sub.add(
      this.apiService.getPipeline().subscribe({
        next: (data) => (this.pipelineData = data),
        error: () => {
          this.pipelineData = [
            { name: 'Submitted', count: 45, percentage: 100 },
            { name: 'AI Processing', count: 28, percentage: 62 },
            { name: 'Human Review', count: 12, percentage: 27 },
            { name: 'Chain Seal', count: 8, percentage: 18 },
            { name: 'Complete', count: 38, percentage: 84 },
          ];
        },
      })
    );
  }

  loadInsights(): void {
    this.sub.add(
      this.apiService.getInsights().subscribe({
        next: (data) => (this.aiInsights = (data.insights || data as any).slice(0, 5)),
        error: () => {
          this.aiInsights = [
            { id: '1', title: 'High-Risk Pattern Detected', description: '3 verifications from the same employer show inconsistent data patterns.', type: 'risk', confidence: 92, createdAt: new Date().toISOString() },
            { id: '2', title: 'Processing Efficiency Up 15%', description: 'AI processing time reduced due to improved document recognition.', type: 'efficiency', confidence: 87, createdAt: new Date().toISOString() },
            { id: '3', title: 'DPDP Compliance Alert', description: 'New consent requirements effective next month. Update templates.', type: 'compliance', confidence: 95, createdAt: new Date().toISOString() },
            { id: '4', title: 'Auto-escalation Recommended', description: '2 cases exceed 48hr SLA threshold. Consider manual review.', type: 'recommendation', confidence: 88, createdAt: new Date().toISOString() },
          ];
        },
      })
    );
  }

  get isDark(): boolean {
    return this.themeService.isDark;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  get greeting(): string {
    const user = this.authService.getCurrentUser();
    const name = user?.name?.split(' ')[0] || 'User';
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    return `${timeGreeting}, ${name}`;
  }

  get greetingIcon(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 17) return '🌤️';
    return '🌙';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  goToRecords(): void {
    this.router.navigate(['/records']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  setDelay(delay: number): void {
    this.apiDelay = delay;
    this.loadStats();
    this.loadTrends();
    this.loadActivities();
  }

  getDelayLabel(delay: number): string {
    if (delay === 0) return 'Instant';
    return `${delay}ms`;
  }

  get maxTrendValue(): number {
    if (!this.trends.length) return 100;
    return Math.max(
      ...this.trends.flatMap(t => [t.completed, t.pending, t.flagged, t.aiProcessed]),
      10
    );
  }

  getBarHeight(value: number): string {
    const max = this.maxTrendValue;
    return `${Math.max((value / max) * 100, 2)}%`;
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'auth': return '\uD83D\uDD12';
      case 'verification': return '\uD83D\uDD0D';
      case 'admin': return '\u2699';
      case 'system': return '\u2699';
      case 'ai': return '\uD83E\uDD16';
      default: return '\uD83D\uDCC4';
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'auth': return 'var(--accent-teal)';
      case 'verification': return 'var(--accent-blue)';
      case 'admin': return 'var(--accent-gold)';
      case 'system': return 'var(--text-tertiary)';
      case 'ai': return 'var(--accent-purple)';
      default: return 'var(--text-tertiary)';
    }
  }

  getTimeAgo(dateStr: string): string {
    const now = new Date().getTime();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  getSuccessRateColor(rate: number): string {
    if (rate >= 90) return 'var(--accent-green)';
    if (rate >= 70) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  }

  getVisibleTrends(): TrendData[] {
    return this.trends.slice(-8);
  }

  getInsightIcon(type: string): string {
    switch (type) {
      case 'risk': return '\u26A0';
      case 'efficiency': return '\u26A1';
      case 'compliance': return '\uD83D\uDCDC';
      case 'recommendation': return '\uD83D\uDCA1';
      default: return '\u2139';
    }
  }

  getInsightClass(type: string): string {
    return `insight-${type}`;
  }

  getPipelineColor(index: number): string {
    const colors = ['var(--accent-blue)', 'var(--accent-purple)', 'var(--accent-orange)', 'var(--accent-teal)', 'var(--accent-green)'];
    return colors[index % colors.length];
  }
}
