import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { ApiService } from '../services/api.service';
import { ThemeService } from './theme.service';
import { AiChatWidgetComponent } from './ai-chat-widget.component';
import { User } from '../models/user.model';
import { AppNotification } from '../models/dashboard.model';
import { Subscription } from 'rxjs';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AiChatWidgetComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  notifications: AppNotification[] = [];
  showNotifications = false;
  sidebarCollapsed = false;
  showMobileSidebar = false;

  sections: SidebarSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Records', icon: 'records', route: '/records' },
      ],
    },
    {
      title: 'AI Engines',
      items: [
        { label: 'CredScan AI', icon: 'credscan', route: '/credscan' },
        { label: 'ForensiDoc AI', icon: 'forensidoc', route: '/forensidoc' },
        { label: 'NexusAI Agent', icon: 'nexus', route: '/nexus' },
      ],
    },
    {
      title: 'Verification',
      items: [
        { label: 'LiveID Verify', icon: 'liveid', route: '/liveid' },
        { label: 'ChatVerify', icon: 'chatverify', route: '/chatverify' },
        { label: 'DeepGuard AI', icon: 'deepguard', route: '/deepguard' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'ChainSeal', icon: 'chainseal', route: '/chainseal' },
        { label: 'Admin', icon: 'admin', route: '/admin' },
      ],
    },
  ];

  private sub = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private apiService: ApiService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.sub.add(
      this.authService.currentUser$.subscribe((user: User | null) => {
        this.currentUser = user;
      })
    );
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadNotifications(): void {
    this.sub.add(
      this.dashboardService.getNotifications().subscribe({
        next: (notifs: AppNotification[]) => (this.notifications = notifs),
        error: () => (this.notifications = []),
      })
    );
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  get isDark(): boolean {
    return this.themeService.isDark;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showMobileSidebar = false;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileSidebar(): void {
    this.showMobileSidebar = !this.showMobileSidebar;
  }

  closeMobileSidebar(): void {
    this.showMobileSidebar = false;
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  navigate(route: string): void {
    this.router.navigate([route]);
    this.showMobileSidebar = false;
    this.showNotifications = false;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getNotificationClass(type: string): string {
    return `notif-${type}`;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'verification': return '🔍';
      case 'system': return '⚙️';
      case 'alert': return '⚠️';
      case 'ai': return '🤖';
      case 'compliance': return '📋';
      default: return '🔔';
    }
  }

  markAsRead(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    if (!notification.isRead) {
      this.sub.add(
        this.apiService.markNotificationRead(notification.id).subscribe({
          next: () => {
            notification.isRead = true;
          },
          error: () => {
            notification.isRead = true;
          },
        })
      );
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

  shouldShowAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  getCurrentPageTitle(): string {
    const url = this.router.url;
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/records': 'Records',
      '/admin': 'Admin Panel',
      '/credscan': 'CredScan AI',
      '/forensidoc': 'ForensiDoc AI',
      '/nexus': 'NexusAI Agent',
      '/liveid': 'LiveID Verify',
      '/chatverify': 'ChatVerify',
      '/deepguard': 'DeepGuard AI',
      '/chainseal': 'ChainSeal',
    };
    for (const [route, title] of Object.entries(titles)) {
      if (url.includes(route)) return title;
    }
    return 'VeriShield';
  }
}
