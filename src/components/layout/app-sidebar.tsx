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
  Brain,
  ShieldCheck,
  Link,
  ShieldAlert,
  ShieldUser,
  MessageCircle,
  Bot,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationsStore } from '@/lib/store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItemConfig {
  id: AppView;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: number;
  section?: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'overview' },
  { id: 'records', label: 'Verifications', icon: FileSearch, section: 'overview' },
  { id: 'credscan', label: 'CredScan AI', icon: Brain, section: 'ai' },
  { id: 'forensidoc', label: 'ForensiDoc AI', icon: ShieldCheck, section: 'ai' },
  { id: 'nexus', label: 'NexusAI Agent', icon: Bot, section: 'ai' },
  { id: 'deepguard', label: 'DeepGuard AI', icon: ShieldAlert, section: 'ai' },
  { id: 'liveid', label: 'LiveID Verify', icon: ShieldUser, section: 'verify' },
  { id: 'chatverify', label: 'ChatVerify', icon: MessageCircle, section: 'verify' },
  { id: 'chainseal', label: 'ChainSeal', icon: Link, section: 'verify' },
  { id: 'admin', label: 'User Management', icon: Users, adminOnly: true, section: 'system' },
  { id: 'activity', label: 'Activity Log', icon: Activity, section: 'system' },
  { id: 'notifications', label: 'Notifications', icon: Bell, section: 'system' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'system' },
];

const SECTION_LABELS: Record<string, string> = {
  overview: 'Overview',
  ai: 'AI Engines',
  verify: 'Verification',
  system: 'System',
};

// Stagger animation variants
const sidebarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const brandVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const { currentView, sidebarOpen, navigate, toggleSidebar } = useNavigationStore();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const isAdmin = user?.role === 'admin';

  // Group nav items by section
  const sections = NAV_ITEMS.reduce<Record<string, NavItemConfig[]>>((acc, item) => {
    if (item.adminOnly && !isAdmin) return acc;
    const section = item.section || 'other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 272 : 72 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative flex flex-col h-screen sticky top-0 z-30 overflow-hidden',
        'noise',
        // Premium gradient background
        'bg-gradient-to-b from-[oklch(0.145_0.015_250)] via-[oklch(0.125_0.018_250)] to-[oklch(0.105_0.015_250)]',
        // Premium right-edge shadow
        'shadow-[1px_0_32px_oklch(0.65_0.17_175/8%),1px_0_8px_oklch(0_0_0/40%)]',
      )}
    >
      {/* ─── Brand Section ─── */}
      <motion.div
        variants={brandVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center h-[68px] px-5 relative"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Premium brand icon with glow */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[oklch(0.65_0.17_175)] via-[oklch(0.55_0.15_175)] to-[oklch(0.45_0.12_175)] flex items-center justify-center shadow-luxury">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {/* Subtle glow ring behind icon */}
            <div className="absolute inset-0 rounded-xl bg-[oklch(0.65_0.17_175/15%)] blur-md -z-10" />
          </div>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden flex items-center gap-2"
              >
                <span className="text-gradient font-bold text-xl tracking-tight whitespace-nowrap">
                  VeriShield
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[oklch(0.75_0.16_55)] opacity-60" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Decorative separator line with gradient */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[oklch(0.65_0.17_175/20%)] to-transparent" />

      {/* ─── Navigation ─── */}
      <motion.nav
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 py-3 px-3 overflow-y-auto overflow-x-hidden space-y-1"
      >
        {Object.entries(sections).map(([sectionKey, items], sectionIdx) => (
          <div key={sectionKey}>
            {/* Section label */}
            {sidebarOpen && sectionIdx > 0 && (
              <motion.div
                variants={navItemVariants}
                className="px-3 pt-4 pb-2"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[oklch(0.50_0.02_250/60%)]">
                  {SECTION_LABELS[sectionKey] || sectionKey}
                </span>
              </motion.div>
            )}

            {/* Section divider for non-first sections when collapsed */}
            {!sidebarOpen && sectionIdx > 0 && (
              <div className="mx-2 my-2 h-px bg-gradient-to-r from-transparent via-[oklch(0.65_0.17_175/15%)] to-transparent" />
            )}

            {items.map((item) => {
              const isActive = currentView === item.id;
              const badge = item.id === 'notifications' ? unreadCount : undefined;
              const Icon = item.icon;

              const navButton = (
                <motion.button
                  key={item.id}
                  variants={navItemVariants}
                  onClick={() => navigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl text-sm font-medium relative group',
                    'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    // Default state
                    !isActive && 'text-[oklch(0.65_0.01_250/70%)] hover:text-[oklch(0.90_0.01_250)]',
                    // Padding adjusts based on collapsed state
                    sidebarOpen ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                    // Active state — premium gradient bg + luxury shadow
                    isActive && 'text-white shadow-luxury',
                  )}
                  style={
                    isActive
                      ? {
                          background:
                            'linear-gradient(135deg, oklch(0.55 0.15 175), oklch(0.45 0.12 185))',
                        }
                      : undefined
                  }
                >
                  {/* Hover background slide-in from left */}
                  {!isActive && (
                    <span
                      className={cn(
                        'absolute inset-0 rounded-xl bg-[oklch(0.65_0.17_175/8%)]',
                        'origin-left scale-x-0 group-hover:scale-x-100',
                        'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                      )}
                    />
                  )}

                  {/* Active glowing dot indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-dot"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.17_175)]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      style={{
                        boxShadow:
                          '0 0 8px oklch(0.65 0.17 175 / 60%), 0 0 16px oklch(0.65 0.17 175 / 30%)',
                      }}
                    />
                  )}

                  {/* Active left accent bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-gradient-to-b from-[oklch(0.75_0.17_175)] to-[oklch(0.55_0.15_175)]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Icon with hover scale */}
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] flex-shrink-0 relative z-10',
                      'transition-transform duration-200 group-hover:scale-110',
                      isActive
                        ? 'text-white'
                        : 'text-[oklch(0.55_0.04_250/60%)] group-hover:text-[oklch(0.65_0.17_175)]',
                    )}
                  />

                  {/* Label */}
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                          'whitespace-nowrap overflow-hidden relative z-10',
                          'tracking-[0.01em]',
                        )}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Badge */}
                  {badge !== undefined && badge > 0 && (
                    <span
                      className={cn(
                        'relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gradient-to-r from-[oklch(0.65_0.17_175)] to-[oklch(0.55_0.15_175)] text-white',
                        !sidebarOpen && 'absolute -top-1 -right-1',
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </motion.button>
              );

              // When collapsed, wrap in tooltip
              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <span className="font-medium">{item.label}</span>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return navButton;
            })}
          </div>
        ))}
      </motion.nav>

      {/* ─── User Profile Section ─── */}
      <div className="p-3">
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <motion.div
              key="user-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                'relative rounded-xl p-3',
                'glass-premium',
              )}
            >
              <div className="flex items-center gap-3">
                {/* Avatar with premium ring */}
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[oklch(0.65_0.17_175)] to-[oklch(0.45_0.12_175)] flex items-center justify-center ring-2 ring-[oklch(0.65_0.17_175/20%)]">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  {/* Online status dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[oklch(0.55_0.17_155)] ring-2 ring-[oklch(0.155_0.018_250)] animate-pulse-glow" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[oklch(0.90_0.01_250)] truncate tracking-[0.005em]">
                    {user?.name}
                  </p>
                  <span
                    className={cn(
                      'inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.08em]',
                      'bg-gradient-to-r from-[oklch(0.65_0.17_175/20%)] to-[oklch(0.75_0.16_55/15%)]',
                      'text-[oklch(0.65_0.17_175)]',
                      'border border-[oklch(0.65_0.17_175/15%)]',
                    )}
                  >
                    {user?.role === 'user' ? 'General User' : user?.role}
                  </span>
                </div>

                {/* Minimal logout button */}
                <button
                  onClick={logout}
                  className={cn(
                    'flex-shrink-0 p-1.5 rounded-lg',
                    'text-[oklch(0.50_0.02_250/40%)] hover:text-[oklch(0.55_0.22_25)]',
                    'hover:bg-[oklch(0.55_0.22_25/10%)]',
                    'transition-all duration-200',
                  )}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="user-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[oklch(0.65_0.17_175)] to-[oklch(0.45_0.12_175)] flex items-center justify-center cursor-pointer ring-2 ring-[oklch(0.65_0.17_175/20%)]">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <div className="text-center">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs opacity-70">
                      {user?.role === 'user' ? 'General User' : user?.role}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Premium Toggle Button ─── */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3.5 top-20 w-7 h-7 rounded-full flex items-center justify-center z-40',
          'bg-[oklch(0.155_0.018_250)] border border-[oklch(0.65_0.17_175/20%)]',
          'text-[oklch(0.65_0.17_175/80%)] hover:text-[oklch(0.65_0.17_175)]',
          'hover:bg-[oklch(0.20_0.03_250)] hover:border-[oklch(0.65_0.17_175/40%)]',
          'shadow-luxury',
          'transition-all duration-300',
          'group/toggle',
        )}
      >
        <div className="transition-transform duration-300 group-hover/toggle:scale-110">
          {sidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </div>
      </button>
    </motion.aside>
  );
}
