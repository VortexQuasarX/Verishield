import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ApiService } from '../../services/api.service';
import { SettingsData, ActivityEntry } from '../../models/system.model';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit, OnDestroy {
  activeTab: 'users' | 'settings' | 'activity' = 'users';

  // Users Tab
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;
  searchQuery = '';

  showCreateModal = false;
  newUser = { email: '', name: '', password: '', role: 'user' };
  creatingUser = false;
  createError = '';

  showEditModal = false;
  editingUser: User | null = null;
  editForm = { email: '', name: '', role: 'user', isActive: true };
  savingUser = false;
  editError = '';

  showDeleteModal = false;
  deletingUser: User | null = null;
  deletingInProgress = false;

  // Settings Tab
  settings: SettingsData = {
    defaultTurnaround: '6 hours',
    autoEscalation: true,
    apiKey: '',
    webhookUrl: '',
    emailAlerts: true,
    autoSealRecords: false,
  };
  settingsLoading = true;
  settingsSaving = false;
  settingsSaved = false;

  // Activity Tab
  activities: ActivityEntry[] = [];
  activitiesLoading = true;

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;

  private sub = new Subscription();

  constructor(private userService: UserService, private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadSettings();
    this.loadActivities();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ---- Tab Navigation ----
  setTab(tab: 'users' | 'settings' | 'activity'): void {
    this.activeTab = tab;
  }

  // ---- Users ----
  loadUsers(): void {
    this.loading = true;
    this.sub.add(
      this.userService.getUsers(200).subscribe({
        next: (users) => {
          this.users = users;
          this.applyFilter();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      })
    );
  }

  applyFilter(): void {
    if (!this.searchQuery) {
      this.filteredUsers = [...this.users];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }

  onSearch(): void {
    this.applyFilter();
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newUser = { email: '', name: '', password: '', role: 'user' };
    this.createError = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreateUser(): void {
    if (!this.newUser.email || !this.newUser.name || !this.newUser.password) {
      this.createError = 'All fields are required.';
      return;
    }

    if (this.newUser.password.length < 6) {
      this.createError = 'Password must be at least 6 characters.';
      return;
    }

    this.creatingUser = true;
    this.createError = '';

    this.sub.add(
      this.userService.createUser(this.newUser).subscribe({
        next: () => {
          this.creatingUser = false;
          this.showCreateModal = false;
          this.showNotification('User created successfully', 'success');
          this.loadUsers();
        },
        error: (err) => {
          this.creatingUser = false;
          if (err.status === 409) {
            this.createError = 'A user with this email already exists.';
          } else {
            this.createError = 'Failed to create user. Please try again.';
          }
        },
      })
    );
  }

  openEditModal(user: User): void {
    this.editingUser = user;
    this.editForm = {
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };
    this.showEditModal = true;
    this.editError = '';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
  }

  submitEditUser(): void {
    if (!this.editForm.email || !this.editForm.name) {
      this.editError = 'Email and name are required.';
      return;
    }

    if (!this.editingUser) return;

    this.savingUser = true;
    this.editError = '';

    this.sub.add(
      this.userService.updateUser(this.editingUser.id, this.editForm).subscribe({
        next: () => {
          this.savingUser = false;
          this.showEditModal = false;
          this.showNotification('User updated successfully', 'success');
          this.loadUsers();
        },
        error: () => {
          this.savingUser = false;
          this.editError = 'Failed to update user. Please try again.';
        },
      })
    );
  }

  openDeleteModal(user: User): void {
    this.deletingUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingUser = null;
  }

  confirmDelete(): void {
    if (!this.deletingUser) return;

    this.deletingInProgress = true;
    this.sub.add(
      this.userService.deleteUser(this.deletingUser.id).subscribe({
        next: () => {
          this.deletingInProgress = false;
          this.showDeleteModal = false;
          this.showNotification('User deleted successfully', 'success');
          this.loadUsers();
        },
        error: () => {
          this.deletingInProgress = false;
          this.showDeleteModal = false;
          this.showNotification('Failed to delete user', 'error');
        },
      })
    );
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    this.sub.add(
      this.userService.updateUser(user.id, { isActive: newStatus }).subscribe({
        next: () => {
          this.showNotification(
            `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
            'success'
          );
          this.loadUsers();
        },
        error: () => {
          this.showNotification('Failed to update user status', 'error');
        },
      })
    );
  }

  // ---- Settings ----
  loadSettings(): void {
    this.settingsLoading = true;
    this.sub.add(
      this.apiService.getSettings().subscribe({
        next: (data) => {
          this.settings = data;
          this.settingsLoading = false;
        },
        error: () => {
          this.settingsLoading = false;
        },
      })
    );
  }

  saveSettings(): void {
    this.settingsSaving = true;
    this.sub.add(
      this.apiService.updateSettings(this.settings).subscribe({
        next: () => {
          this.settingsSaving = false;
          this.settingsSaved = true;
          this.showNotification('Settings saved successfully', 'success');
          setTimeout(() => (this.settingsSaved = false), 3000);
        },
        error: () => {
          this.settingsSaving = false;
          this.showNotification('Failed to save settings', 'error');
        },
      })
    );
  }

  // ---- Activity ----
  loadActivities(): void {
    this.activitiesLoading = true;
    this.sub.add(
      this.apiService.getActivity(20).subscribe({
        next: (logs) => {
          // Map ActivityLog[] from API to ActivityEntry[] for display
          this.activities = logs.map(log => ({
            id: log.id,
            action: log.action,
            user: log.userName || 'System',
            timestamp: log.createdAt,
            category: log.category || 'general',
            details: log.details || '',
          }));
          this.activitiesLoading = false;
        },
        error: () => {
          this.activities = [];
          this.activitiesLoading = false;
        },
      })
    );
  }

  // ---- Shared ----
  showNotification(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Never';
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
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getRoleBadgeClass(role: string): string {
    return `badge badge-${role}`;
  }

  getStatusBadgeClass(isActive: boolean): string {
    return `badge badge-${isActive ? 'active' : 'inactive'}`;
  }

  get activeUsersCount(): number {
    return this.users.filter((u) => u.isActive).length;
  }

  get adminCount(): number {
    return this.users.filter((u) => u.role === 'admin').length;
  }

  getActivityIcon(category: string): string {
    switch (category) {
      case 'auth': return '\uD83D\uDD12';
      case 'verification': return '\uD83D\uDD0D';
      case 'admin': return '\u2699';
      case 'ai': return '\uD83E\uDD16';
      case 'system': return '\uD83D\uDD12';
      default: return '\uD83D\uDCC4';
    }
  }

  getActivityColor(category: string): string {
    switch (category) {
      case 'auth': return 'var(--accent-teal)';
      case 'verification': return 'var(--accent-blue)';
      case 'admin': return 'var(--accent-gold)';
      case 'ai': return 'var(--accent-purple)';
      case 'system': return 'var(--accent-teal)';
      default: return 'var(--text-tertiary)';
    }
  }
}
