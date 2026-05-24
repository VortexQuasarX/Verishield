// =====================================================
// MPloyChek - Global State Store (Zustand)
// Centralized state management for auth, navigation, and UI
// =====================================================

import { create } from 'zustand';
import type { AuthUser, AppView, AppNotification, ActivityLog } from '@/types';
import { getStoredUser, getStoredToken, setAuth, clearAuth } from '@/lib/api';

// ---- Auth Store ----
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: (token: string, user: AuthUser) => {
    setAuth(token, user);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    clearAuth();
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  hydrate: () => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      set({ token, user, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));

// ---- Navigation Store ----
interface NavigationState {
  currentView: AppView;
  sidebarOpen: boolean;
  navigate: (view: AppView) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'dashboard',
  sidebarOpen: true,

  navigate: (view: AppView) => set({ currentView: view }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}));

// ---- Notifications Store ----
interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  setNotifications: (notifications: AppNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications: AppNotification[]) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  markAsRead: (id: string) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));

// ---- Activity Store ----
interface ActivityState {
  activities: ActivityLog[];
  setActivities: (activities: ActivityLog[]) => void;
  addActivity: (activity: ActivityLog) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],

  setActivities: (activities: ActivityLog[]) => set({ activities }),

  addActivity: (activity: ActivityLog) =>
    set((state) => ({
      activities: [activity, ...state.activities].slice(0, 50),
    })),
}));

// ---- UI Store ----
interface UIState {
  globalLoading: boolean;
  loadingMessage: string;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  globalLoading: false,
  loadingMessage: '',

  setGlobalLoading: (loading: boolean, message = '') =>
    set({ globalLoading: loading, loadingMessage: message }),
}));
