'use client';

import { useAuthStore, useNavigationStore, useNotificationsStore } from '@/lib/store';
import { Moon, Sun, Bell, LogOut, Menu, ChevronRight, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  records: 'Verification Records',
  credscan: 'CredScan AI',
  forensidoc: 'ForensiDoc AI',
  chainseal: 'ChainSeal',
  nexus: 'NexusAI Agent',
  deepguard: 'DeepGuard AI',
  liveid: 'LiveID Verify',
  chatverify: 'ChatVerify',
  admin: 'User Management',
  activity: 'Activity Log',
  notifications: 'Notification Center',
  settings: 'Settings',
};

export function AppNavbar() {
  const { user, logout } = useAuthStore();
  const { currentView, toggleSidebar } = useNavigationStore();
  const { unreadCount } = useNotificationsStore();
  const { navigate } = useNavigationStore();
  const { theme, setTheme } = useTheme();

  const breadcrumbs = [
    { label: 'VeriShield Pro', active: false },
    { label: VIEW_LABELS[currentView] || currentView, active: true },
  ];

  return (
    <header
      className={cn(
        'h-16 sticky top-0 z-20 relative',
        'glass-premium',
      )}
    >
      {/* Bottom border with gradient (teal to transparent) */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.65_0.17_175/25%)] to-transparent" />

      <div className="flex items-center justify-between h-full px-6">
        {/* ─── Left: Breadcrumbs & Menu ─── */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-[oklch(0.60_0.015_250)] hover:text-[oklch(0.90_0.01_250)] hover:bg-[oklch(0.65_0.17_175/8%)]"
            onClick={toggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Premium breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-[oklch(0.50_0.02_250/30%)]" />
                )}
                <span
                  className={cn(
                    'transition-colors duration-200',
                    crumb.active
                      ? 'font-semibold text-[oklch(0.90_0.01_250)] tracking-[0.005em]'
                      : 'text-[oklch(0.55_0.02_250/60%)] hover:text-[oklch(0.65_0.17_175)]',
                  )}
                >
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        </div>

        {/* ─── Right: Actions ─── */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'relative p-2 rounded-lg',
              'text-[oklch(0.55_0.02_250/60%)] hover:text-[oklch(0.65_0.17_175)]',
              'hover:bg-[oklch(0.65_0.17_175/8%)]',
              'transition-all duration-200',
            )}
            aria-label="Toggle theme"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </motion.div>
          </button>

          {/* Premium notification bell with animated badge */}
          <button
            onClick={() => navigate('notifications')}
            className={cn(
              'relative p-2 rounded-lg',
              'text-[oklch(0.55_0.02_250/60%)] hover:text-[oklch(0.65_0.17_175)]',
              'hover:bg-[oklch(0.65_0.17_175/8%)]',
              'transition-all duration-200',
              'group/bell',
            )}
          >
            <Bell
              className={cn(
                'w-[18px] h-[18px] transition-transform duration-200 group-hover/bell:rotate-12',
              )}
            />
            {/* Animated notification badge */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 20,
                  }}
                  className={cn(
                    'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1',
                    'rounded-full flex items-center justify-center',
                    'text-[9px] font-bold text-white',
                    'bg-gradient-to-r from-[oklch(0.55_0.22_25)] to-[oklch(0.60_0.20_15)]',
                    'shadow-[0_0_8px_oklch(0.55_0.22_25/40%)]',
                    'animate-pulse-glow',
                  )}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
            {/* Bell ring ripple when notifications present */}
            {unreadCount > 0 && (
              <motion.span
                className="absolute inset-0 rounded-lg border border-[oklch(0.55_0.22_25/20%)]"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-gradient-to-b from-transparent via-[oklch(0.24_0.02_250)] to-transparent mx-1" />

          {/* Premium user dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl',
                  'hover:bg-[oklch(0.65_0.17_175/8%)]',
                  'transition-all duration-200',
                  'group/user',
                )}
              >
                {/* Avatar with subtle ring */}
                <div className="relative">
                  <Avatar className="w-8 h-8 ring-1 ring-[oklch(0.65_0.17_175/15%)] group-hover/user:ring-[oklch(0.65_0.17_175/30%)] transition-all duration-200">
                    <AvatarFallback
                      className={cn(
                        'bg-gradient-to-br from-[oklch(0.65_0.17_175/20%)] to-[oklch(0.65_0.17_175/10%)]',
                        'text-[oklch(0.65_0.17_175)] text-sm font-bold',
                        'transition-all duration-200',
                      )}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-[oklch(0.90_0.01_250)] leading-tight tracking-[0.005em]">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-[oklch(0.50_0.02_250/60%)] leading-tight">
                    {user?.email}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className={cn(
                'w-60 p-2 rounded-xl',
                'glass-premium',
                'border-[oklch(0.65_0.17_175/12%)]',
              )}
            >
              {/* User info header */}
              <div className="px-2 py-2 mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.65_0.17_175)] to-[oklch(0.45_0.12_175)] flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[oklch(0.90_0.01_250)]">
                      {user?.name}
                    </p>
                    <p className="text-xs text-[oklch(0.50_0.02_250/60%)]">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.08em]',
                      'bg-gradient-to-r from-[oklch(0.65_0.17_175/20%)] to-[oklch(0.75_0.16_55/15%)]',
                      'text-[oklch(0.65_0.17_175)]',
                      'border border-[oklch(0.65_0.17_175/12%)]',
                    )}
                  >
                    {user?.role === 'user' ? 'General User' : user?.role}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-[oklch(0.24_0.02_250/60%)]" />

              <DropdownMenuItem
                onClick={() => navigate('settings')}
                className={cn(
                  'rounded-lg py-2 cursor-pointer',
                  'focus:bg-[oklch(0.65_0.17_175/8%)] focus:text-[oklch(0.90_0.01_250)]',
                )}
              >
                <Settings className="w-4 h-4 mr-2 text-[oklch(0.55_0.02_250/50%)]" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('admin')}
                className={cn(
                  'rounded-lg py-2 cursor-pointer',
                  'focus:bg-[oklch(0.65_0.17_175/8%)] focus:text-[oklch(0.90_0.01_250)]',
                )}
              >
                <User className="w-4 h-4 mr-2 text-[oklch(0.55_0.02_250/50%)]" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[oklch(0.24_0.02_250/60%)]" />

              <DropdownMenuItem
                className={cn(
                  'rounded-lg py-2 cursor-pointer',
                  'text-[oklch(0.55_0.22_25)] focus:text-[oklch(0.65_0.22_25)]',
                  'focus:bg-[oklch(0.55_0.22_25/8%)]',
                )}
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
