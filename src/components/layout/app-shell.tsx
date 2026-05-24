'use client';

import { useAuthStore, useNavigationStore } from '@/lib/store';
import { AppSidebar } from './app-sidebar';
import { AppNavbar } from './app-navbar';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { RecordsView } from '@/components/records/records-view';
import { AdminView } from '@/components/admin/admin-view';
import { ActivityView } from '@/components/shared/activity-view';
import { NotificationsView } from '@/components/shared/notifications-view';
import { SettingsView } from '@/components/shared/settings-view';
import { AnimatePresence, motion } from 'framer-motion';

const VIEW_MAP: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  records: RecordsView,
  admin: AdminView,
  activity: ActivityView,
  notifications: NotificationsView,
  settings: SettingsView,
};

export function AppShell() {
  const { user } = useAuthStore();
  const { currentView } = useNavigationStore();
  const isAdmin = user?.role === 'admin';

  // Guard admin view
  const activeView = currentView === 'admin' && !isAdmin ? 'dashboard' : currentView;
  const ViewComponent = VIEW_MAP[activeView] || DashboardView;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppNavbar />
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ViewComponent />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Sticky Footer */}
        <footer className="mt-auto border-t border-border bg-card/50 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} MPloyChek Technologies Pvt. Ltd.</span>
            <span>v2.4.0 • AI-Powered Verification Platform</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
