'use client';

import { useAuthStore, useNavigationStore } from '@/lib/store';
import type { AppView } from '@/types';
import {
  LayoutDashboard,
  FileSearch,
  Users,
  Activity,
  Bell,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationsStore } from '@/lib/store';

interface NavItemConfig {
  id: AppView;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: number;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'records', label: 'Verifications', icon: FileSearch },
  { id: 'admin', label: 'User Management', icon: Users, adminOnly: true },
  { id: 'activity', label: 'Activity Log', icon: Activity },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const { user } = useAuthStore();
  const { currentView, sidebarOpen, navigate, toggleSidebar } = useNavigationStore();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const isAdmin = user?.role === 'admin';

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0 z-30"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden"
              >
                MPloyChek
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = currentView === item.id;
          const badge = item.id === 'notifications' ? unreadCount : undefined;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {badge !== undefined && badge > 0 && (
                <span className={cn(
                  'flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground',
                  !sidebarOpen && 'absolute -top-1 -right-1'
                )}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm z-40"
      >
        {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </motion.aside>
  );
}
