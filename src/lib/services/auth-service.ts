// =====================================================
// VeriShield - Auth Service
// Service layer for authentication operations
// Handles login, logout, session management
// =====================================================

import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { LoginCredentials, AuthUser } from '@/types';

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * AuthService - Handles authentication operations
 * 
 * Architecture Pattern: Service Layer
 * - Manages authentication state via Zustand store
 * - Provides login/logout methods
 * - Handles session persistence
 * - Validates credentials before API calls
 */
export const AuthService = {
  /**
   * Authenticate user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Client-side validation before API call
    if (!credentials.email.trim()) {
      return { success: false, error: 'Email is required' };
    }
    if (!credentials.password.trim()) {
      return { success: false, error: 'Password is required' };
    }

    try {
      const response = await authApi.login(credentials);
      const { login } = useAuthStore.getState();
      login(response.token, response.user);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  },

  /**
   * Log out current user
   */
  logout(): void {
    const { logout } = useAuthStore.getState();
    logout();
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return useAuthStore.getState().user;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  },

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return useAuthStore.getState().user?.role === 'admin';
  },

  /**
   * Quick login with demo credentials
   */
  async loginAsDemo(role: 'admin' | 'user'): Promise<AuthResult> {
    const credentials: LoginCredentials = role === 'admin'
      ? { email: 'admin@verishield.ai', password: 'admin123' }
      : { email: 'user@verishield.ai', password: 'user123' };
    return this.login(credentials);
  },
};
