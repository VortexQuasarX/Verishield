'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RefreshCw, Filter, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { activityApi } from '@/lib/api';
import type { ActivityLog, ActivityCategory } from '@/types';

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  verification: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  system: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  general: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ai: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export function ActivityView() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await activityApi.getAll({ delay: 600, limit: 30 });
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filtered = categoryFilter === 'all'
    ? activities
    : activities.filter(a => a.category === categoryFilter);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
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
          <h1 className="text-2xl font-bold tracking-tight"><span className="text-gradient">Activity Log</span></h1>
          <p className="text-muted-foreground text-sm mt-1">System-wide audit trail and activity timeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-9">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="verification">Verification</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchActivities} className="h-9">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-border/50 card-premium shadow-luxury">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border/50">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 skeleton-shimmer" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-64 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No activity found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
              {filtered.map((activity, i) => {
                const isExpanded = expandedActivity === activity.id;
                return (
                  <div key={activity.id}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-primary/[0.03] hover:to-transparent transition-colors cursor-pointer"
                      onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {activity.userName?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{activity.userName || 'System'}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{formatTime(activity.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className={`text-[10px] bg-gradient-to-r ${CATEGORY_COLORS[activity.category]}`}>
                          {activity.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground w-14 text-right">{formatTimeAgo(activity.createdAt)}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </motion.div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pl-16">
                            <div className="p-3 rounded-lg glass-premium border border-border/30 space-y-2">
                              {activity.details && (
                                <div>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Details</span>
                                  <p className="text-sm text-foreground mt-0.5">{activity.details}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {activity.userId && (
                                  <span>User ID: <span className="font-mono">{activity.userId}</span></span>
                                )}
                                <span>Timestamp: <span className="font-mono">{new Date(activity.createdAt).toISOString()}</span></span>
                              </div>
                              <div className="pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] gap-1.5 px-2.5"
                                  onClick={() => {
                                    const info = `Action: ${activity.action}\nUser: ${activity.userName || 'System'}\nUser ID: ${activity.userId || 'N/A'}\nCategory: ${activity.category}\nDetails: ${activity.details || 'N/A'}\nTimestamp: ${new Date(activity.createdAt).toISOString()}`;
                                    navigator.clipboard.writeText(info);
                                    toast('Activity details copied to clipboard');
                                  }}
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
