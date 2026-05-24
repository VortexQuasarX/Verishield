'use client';

import { useAuthStore, useNavigationStore, useNotificationsStore } from '@/lib/store';
import { Moon, Sun, Bell, LogOut, Search, Menu } from 'lucide-react';
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
import { motion } from 'framer-motion';

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  records: 'Verification Records',
  admin: 'User Management',
  activity: 'Activity Log',
  notifications: 'Notification Center',
  settings: 'Settings',
};

export function AppNavbar() {
  const { user, logout } = useAuthStore();
  const { currentView, toggleSidebar } = useNavigationStore();
  const { unreadCount } = useNotificationsStore();
  const { theme, setTheme } = useTheme();

  const breadcrumbs = [
    { label: 'MPloyChek', active: false },
    { label: VIEW_LABELS[currentView] || currentView, active: true },
  ];

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Breadcrumbs & Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                <span className={crumb.active ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Search className="w-4 h-4" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-muted-foreground relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-tight">{user?.name}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
                  {user?.role}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
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
