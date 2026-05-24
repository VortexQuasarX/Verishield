'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationsStore } from '@/lib/store';
import { notificationsApi } from '@/lib/api';
import type { AppNotification, NotificationType } from '@/types';

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export function NotificationsView() {
  const { notifications, setNotifications, markAsRead, markAllRead, unreadCount } = useNotificationsStore();
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter(n => !n.isRead)) {
      try {
        await notificationsApi.markRead(n.id);
      } catch { /* continue */ }
    }
    markAllRead();
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : notifications.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification, i) => {
            const Icon = NOTIFICATION_ICONS[notification.type];
            const colorClass = NOTIFICATION_COLORS[notification.type];

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`border-border/50 transition-all ${!notification.isRead ? 'border-primary/20 bg-primary/[0.02]' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>{notification.title}</p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notification.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</span>
                          <Badge variant="outline" className="text-[9px] capitalize">{notification.type}</Badge>
                          {!notification.isRead && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => handleMarkRead(notification.id)}>
                              <Check className="w-3 h-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
