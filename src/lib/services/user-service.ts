// =====================================================
// VeriShield - User Service
// Service layer for user management operations
// Encapsulates API calls, data transformation, and business logic
// =====================================================

import { usersApi } from '@/lib/api';
import type { AuthUser, CreateUserPayload, UpdateUserPayload, UserRole } from '@/types';

export interface UserListOptions {
  search?: string;
  delay?: number;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive?: boolean;
}

/**
 * UserService - Handles all user management operations
 * 
 * Architecture Pattern: Service Layer
 * - Encapsulates API communication
 * - Handles data transformation
 * - Provides business logic validation
 * - Returns typed responses
 */
export const UserService = {
  /**
   * Fetch all users with optional search
   */
  async getUsers(options: UserListOptions = {}): Promise<AuthUser[]> {
    return usersApi.getAll({
      search: options.search || undefined,
      delay: options.delay,
    });
  },

  /**
   * Create a new user with validation
   */
  async createUser(data: UserFormData): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    if (!data.name.trim()) return { success: false, error: 'Name is required' };
    if (!data.email.trim()) return { success: false, error: 'Email is required' };
    if (!data.password?.trim()) return { success: false, error: 'Password is required' };
    if (data.password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { success: false, error: 'Invalid email format' };

    try {
      const payload: CreateUserPayload = {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
      };
      const user = await usersApi.create(payload);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create user' };
    }
  },

  /**
   * Update an existing user
   */
  async updateUser(id: string, data: Partial<UserFormData>): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: 'Invalid email format' };
    }
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, error: 'Name cannot be empty' };
    }

    try {
      const payload: UpdateUserPayload = {};
      if (data.email) payload.email = data.email;
      if (data.name) payload.name = data.name;
      if (data.role) payload.role = data.role;
      if (data.isActive !== undefined) payload.isActive = data.isActive;

      const user = await usersApi.update(id, payload);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update user' };
    }
  },

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await usersApi.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' };
    }
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(user: AuthUser): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    return this.updateUser(user.id, { isActive: !user.isActive });
  },

  /**
   * Check if user can be modified by current user
   */
  canModifyUser(targetUser: AuthUser, currentUser: AuthUser): boolean {
    if (targetUser.id === currentUser.id) return false;
    return currentUser.role === 'admin';
  },
};
