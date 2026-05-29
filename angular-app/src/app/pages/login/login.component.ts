import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  email = '';
  password = '';
  selectedRole: 'admin' | 'user' = 'user';
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  roles = [
    {
      value: 'admin' as const,
      label: 'Admin',
      description: 'Full system access & user management',
      icon: '&#9878;',
      accent: 'gold',
    },
    {
      value: 'user' as const,
      label: 'General User',
      description: 'Verification records & reports only',
      icon: '&#9673;',
      accent: 'teal',
    },
  ];

  features = [
    { icon: '&#9670;', label: 'AI-Powered Risk Scoring', color: 'teal' },
    { icon: '&#9674;', label: 'Blockchain-Verified Records', color: 'teal' },
    { icon: '&#9889;', label: 'Real-Time Compliance', color: 'gold' },
    { icon: '&#9775;', label: 'DPDP Act Compliant', color: 'teal' },
  ];

  particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * -10,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password, this.selectedRole).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Invalid email or password.';
        } else if (err.status === 403) {
          this.errorMessage = 'Your account has been deactivated.';
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }
        this.cdr.markForCheck();
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  selectRole(role: 'admin' | 'user'): void {
    this.selectedRole = role;
    this.fillDemoCredentials(role);
  }

  fillDemoCredentials(role: 'admin' | 'user'): void {
    if (role === 'admin') {
      this.email = 'admin@verishield.ai';
      this.password = 'admin123';
    } else {
      this.email = 'user@verishield.ai';
      this.password = 'user123';
    }
  }

  getRoleAccentClass(role: 'admin' | 'user'): string {
    return role === 'admin' ? 'role-gold' : 'role-teal';
  }
}
