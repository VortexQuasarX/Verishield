'use client';

import { useEffect } from 'react';
import { useAuthStore, useNavigationStore, useNotificationsStore } from '@/lib/store';
import { AppSidebar } from './app-sidebar';
import { AppNavbar } from './app-navbar';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { RecordsView } from '@/components/records/records-view';
import { AdminView } from '@/components/admin/admin-view';
import { ActivityView } from '@/components/shared/activity-view';
import { NotificationsView } from '@/components/shared/notifications-view';
import { SettingsView } from '@/components/shared/settings-view';
import { CredScanView } from '@/components/ai/credscan-view';
import { ForensiDocView } from '@/components/ai/forensidoc-view';
import { ChainSealView } from '@/components/blockchain/chainseal-view';
import { NexusView } from '@/components/ai/nexus-view';
import { LiveIDView } from '@/components/liveness/liveid-view';
import { ChatVerifyView } from '@/components/whatsapp/chatverify-view';
import { DeepGuardView } from '@/components/deepfake/deepguard-view';
import { AIChatWidget } from '@/components/shared/ai-chat-widget';
import { AnimatePresence, motion } from 'framer-motion';
import { notificationsApi } from '@/lib/api';

const VIEW_MAP: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  records: RecordsView,
  credscan: CredScanView,
  forensidoc: ForensiDocView,
  chainseal: ChainSealView,
  nexus: NexusView,
  liveid: LiveIDView,
  chatverify: ChatVerifyView,
  deepguard: DeepGuardView,
  admin: AdminView,
  activity: ActivityView,
  notifications: NotificationsView,
  settings: SettingsView,
};

export function AppShell() {
  const { user, logout } = useAuthStore();
  const { currentView } = useNavigationStore();
  const { setNotifications } = useNotificationsStore();
  const isAdmin = user?.role === 'admin';

  // Guard admin view
  const activeView = currentView === 'admin' && !isAdmin ? 'dashboard' : currentView;
  const ViewComponent = VIEW_MAP[activeView] || DashboardView;

  // Load notifications on mount so sidebar badge is accurate
  useEffect(() => {
    notificationsApi.getAll().then(setNotifications).catch(console.error);
  }, [setNotifications]);

  // Listen for auth expiration events from API client
  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [logout]);

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
            <span>&copy; {new Date().getFullYear()} VeriShield Technologies Pvt. Ltd.</span>
            <span>VeriShield Pro &bull; AI-Powered Verification Platform</span>
          </div>
        </footer>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}
