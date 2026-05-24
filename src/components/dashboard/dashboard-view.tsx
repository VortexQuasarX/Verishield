'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileSearch,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Timer,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/store';
import { dashboardApi, activityApi } from '@/lib/api';
import type { DashboardStats, VerificationTrend, ActivityLog } from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ---- Animated Counter ----
function AnimatedCounter({ target, duration = 1500, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

// ---- Stat Card ----
function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  delay,
  isLoading,
  suffix = '',
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  change: string;
  changeType: 'up' | 'down';
  delay: number;
  isLoading: boolean;
  suffix?: string;
}) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="w-10 h-10 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="border-border/50 hover:shadow-md transition-shadow duration-200 group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight mb-1 animate-count-up">
            <AnimatedCounter target={value} suffix={suffix} />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {changeType === 'up' ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-red-500" />
            )}
            <span className={changeType === 'up' ? 'text-emerald-500' : 'text-red-500'}>{change}</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const PIE_DATA = [
  { name: 'Completed', value: 2453, color: '#22c55e' },
  { name: 'Pending', value: 156, color: '#f59e0b' },
  { name: 'In Progress', value: 200, color: '#3b82f6' },
  { name: 'Flagged', value: 38, color: '#ef4444' },
];

export function DashboardView() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<VerificationTrend[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [statsRes, trendsRes, activitiesRes] = await Promise.all([
        dashboardApi.getStats(800),
        dashboardApi.getTrends(600),
        activityApi.getAll({ delay: 400, limit: 8 }),
      ]);
      setStats(statsRes);
      setTrends(trendsRes);
      setActivities(activitiesRes);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your verification pipeline today.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="w-fit"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* User Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
            <div className="px-6 pb-5 -mt-8">
              <div className="flex items-end gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold border-4 border-card shadow-lg">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="pb-1">
                  <h2 className="text-lg font-semibold">{user?.name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize text-xs">{user?.role}</Badge>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Verifications"
          value={stats?.totalVerifications || 0}
          icon={FileSearch}
          change="+12.5%"
          changeType="up"
          delay={0.15}
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Cases"
          value={stats?.pendingCases || 0}
          icon={Clock}
          change="-8.2%"
          changeType="down"
          delay={0.2}
          isLoading={isLoading}
        />
        <StatCard
          title="Completed Checks"
          value={stats?.completedChecks || 0}
          icon={CheckCircle2}
          change="+15.3%"
          changeType="up"
          delay={0.25}
          isLoading={isLoading}
        />
        <StatCard
          title="High Risk Flags"
          value={stats?.highRiskFlags || 0}
          icon={AlertTriangle}
          change="+3.1%"
          changeType="up"
          delay={0.3}
          isLoading={isLoading}
        />
        <StatCard
          title="Avg. Processing"
          value={3.2}
          icon={Timer}
          change="-0.5d"
          changeType="down"
          delay={0.35}
          isLoading={isLoading}
          suffix="d"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Verification Trends</CardTitle>
                <div className="flex items-center gap-1 text-xs text-emerald-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +18.2% overall
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[280px] w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#colorCompleted)" strokeWidth={2} />
                    <Area type="monotone" dataKey="pending" stroke="#f59e0b" fill="url(#colorPending)" strokeWidth={2} />
                    <Area type="monotone" dataKey="flagged" stroke="#ef4444" fill="url(#colorFlagged)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[280px] w-full rounded-lg" />
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={PIE_DATA}
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {PIE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 w-full mt-2">
                    {PIE_DATA.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium ml-auto">{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-0">
                {activities.map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">
                        {activity.userName?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{activity.userName}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">
                      {activity.category}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
