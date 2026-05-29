'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Timer,
  TrendingUp,
  Link2,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  Eye,
  FileCheck2,
  Fingerprint,
  Activity,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  Zap,
  Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuthStore, useActivityStore, useNavigationStore } from '@/lib/store';
import { dashboardApi, activityApi, aiInsightsApi, escalationApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { DashboardStats, VerificationTrend, ActivityLog, PipelineStage } from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ---- Animated Counter (Premium) ----
function AnimatedCounter({
  target,
  duration = 1400,
  suffix = '',
  decimals = 0,
}: {
  target: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span className="tabular-nums">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}
      {suffix}
    </span>
  );
}

// ---- Stat Card Configuration ----
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  change: string;
  changeType: 'up' | 'down';
  delay: number;
  isLoading: boolean;
  suffix?: string;
  decimals?: number;
  iconBg?: string;
  iconColor?: string;
  glowColor?: string;
  onClick?: () => void;
}

function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  delay,
  isLoading,
  suffix = '',
  decimals = 0,
  iconBg,
  iconColor,
  glowColor,
  onClick,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="card-premium rounded-2xl shadow-luxury">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="skeleton-shimmer h-4 w-24 rounded-md" />
            <div className="skeleton-shimmer w-11 h-11 rounded-xl" />
          </div>
          <div className="skeleton-shimmer h-9 w-24 mb-3 rounded-md" />
          <div className="skeleton-shimmer h-5 w-32 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        className={`card-premium rounded-2xl shadow-luxury gradient-border group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Top-edge gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Radial glow on hover */}
        {glowColor && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${glowColor}, transparent 70%)`,
            }}
          />
        )}

        <div className="p-5 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{title}</span>
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${iconBg || 'bg-primary/10'}`}
              style={{
                background: iconBg
                  ? undefined
                  : 'linear-gradient(135deg, oklch(0.55 0.15 175 / 15%), oklch(0.65 0.16 55 / 10%))',
              }}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${iconColor || 'text-primary'}`} />
            </div>
          </div>

          {/* Premium large value */}
          <div className="text-[2rem] font-extrabold tracking-tight leading-none mb-2 tabular-nums">
            <AnimatedCounter target={value} suffix={suffix} decimals={decimals} />
          </div>

          {/* Premium pill badge for change */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                changeType === 'up'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {changeType === 'up' ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {change}
            </span>
            <span className="text-[11px] text-muted-foreground/70">vs last month</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Pipeline Stage Bar (Premium) ----
function PipelineVisualization({ pipeline, isLoading }: { pipeline: PipelineStage[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="card-premium rounded-2xl shadow-luxury">
        <div className="p-6">
          <div className="skeleton-shimmer h-5 w-44 mb-4 rounded-md" />
          <div className="skeleton-shimmer h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.6 }}
    >
      <div className="card-premium rounded-2xl shadow-luxury">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.15 175 / 15%), oklch(0.65 0.16 55 / 10%))' }}>
                <Activity className="w-3.5 h-3.5 text-primary" />
              </div>
              Verification Pipeline
            </h3>
            <Badge className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            {pipeline.map((stage, i) => (
              <div key={stage.name} className="flex items-center flex-1 last:flex-initial">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.55 + i * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex-1"
                  style={{ transformOrigin: 'left' }}
                >
                  <div className="relative group/stage">
                    {/* Glowing active indicator for first stage */}
                    {i === 0 && (
                      <div className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-xl opacity-40 blur-md animate-pulse-glow" style={{ backgroundColor: stage.color }} />
                    )}

                    <div
                      className="relative h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold overflow-hidden transition-all duration-300 group-hover/stage:scale-[1.03] group-hover/stage:shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${stage.color}, ${stage.color}dd)`,
                      }}
                    >
                      {/* Shimmer sweep */}
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ delay: 0.9 + i * 0.15, duration: 1.5, ease: 'easeInOut' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                      />
                      <div className="relative z-10 flex flex-col items-center leading-tight">
                        <span className="text-[13px] font-extrabold tabular-nums">{stage.count}</span>
                        <span className="text-[9px] font-medium opacity-80 uppercase tracking-wider">{stage.percentage}%</span>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-[11px] font-semibold text-muted-foreground">{stage.name}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Premium connecting chevron */}
                {i < pipeline.length - 1 && (
                  <div className="mx-1 flex-shrink-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-muted/60 border border-border/50 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---- AI Insights Card (Premium) ----
interface AIInsight {
  icon: string;
  text: string;
  color: string;
  bg: string;
  accent: string;
}

const DEFAULT_INSIGHTS: AIInsight[] = [
  { icon: 'AlertTriangle', text: '3 candidates flagged for employment gaps', color: 'text-amber-500', bg: 'bg-amber-500/10', accent: 'border-amber-500/40' },
  { icon: 'CheckCircle2', text: '12 verifications expected to complete today', color: 'text-emerald-500', bg: 'bg-emerald-500/10', accent: 'border-emerald-500/40' },
  { icon: 'TrendingUp', text: 'Risk score trend: 8% improvement this week', color: 'text-primary', bg: 'bg-primary/10', accent: 'border-primary/40' },
  { icon: 'Fingerprint', text: '5 identity checks awaiting identity verification', color: 'text-blue-500', bg: 'bg-blue-500/10', accent: 'border-blue-500/40' },
];

const iconMap: Record<string, React.ElementType> = {
  AlertTriangle, CheckCircle2, TrendingUp, Fingerprint, Brain, Clock, ShieldCheck, Eye, Activity,
};

function AIInsightsCard({ isLoading, insights }: { isLoading: boolean; insights: AIInsight[] }) {
  const displayInsights = insights.length > 0 ? insights : DEFAULT_INSIGHTS;

  if (isLoading) {
    return (
      <div className="glass-premium rounded-2xl">
        <div className="p-6">
          <div className="skeleton-shimmer h-5 w-40 mb-5 rounded-md" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
    >
      <div className="glass-premium rounded-2xl relative overflow-hidden animate-breathing-ai">
        {/* Subtle mesh gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/[0.03] pointer-events-none" />

        <div className="p-6 relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.15 175 / 20%), oklch(0.65 0.16 55 / 15%))' }}>
              <Brain className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">AI-Powered Insights</h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">CredScan AI analysis</p>
            </div>
            <Badge className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Sparkles className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>

          <div className="space-y-2">
            {displayInsights.map((insight, i) => {
              const InsightIcon = iconMap[insight.icon] || Brain;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + i * 0.08 }}
                  className={`flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all duration-200 border-l-2 ${insight.accent}`}
                >
                  <div className={`w-8 h-8 rounded-lg ${insight.bg} flex items-center justify-center flex-shrink-0`}>
                    <InsightIcon className={`w-4 h-4 ${insight.color}`} />
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">{insight.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Custom Tooltip for Charts (Premium) ----
function CustomChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; dataKey: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-premium rounded-xl p-3.5 shadow-luxury text-xs">
      <p className="font-bold mb-2 text-foreground tracking-tight">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize font-medium">{entry.dataKey}:</span>
          <span className="font-bold text-foreground tabular-nums">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Default Pie Data ----
const DEFAULT_PIE_DATA = [
  { name: 'Completed', value: 2453, color: '#10b981' },
  { name: 'Pending', value: 156, color: '#f59e0b' },
  { name: 'In Progress', value: 200, color: '#3b82f6' },
  { name: 'Flagged', value: 38, color: '#ef4444' },
];

// ---- Activity Icon Mapper ----
function getActivityIcon(category: string) {
  switch (category) {
    case 'auth': return Fingerprint;
    case 'verification': return FileCheck2;
    case 'admin': return ShieldCheck;
    case 'ai': return Brain;
    case 'system': return Activity;
    default: return Eye;
  }
}

// ---- Main Dashboard View ----
export function DashboardView() {
  const { user } = useAuthStore();
  const { activities: storedActivities, setActivities } = useActivityStore();
  const { navigate } = useNavigationStore();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<VerificationTrend[]>([]);
  const [activities, setLocalActivities] = useState<ActivityLog[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiDelay, setApiDelay] = useState(0);
  const [showDelayPanel, setShowDelayPanel] = useState(false);
  const [isDelayFetching, setIsDelayFetching] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isCheckingEscalations, setIsCheckingEscalations] = useState(false);

  const fetchData = useCallback(async (showRefresh = false, delayMs = 0) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    if (delayMs > 0) setIsDelayFetching(true);

    try {
      const statsDelay = delayMs > 0 ? delayMs : 800;
      const trendsDelay = delayMs > 0 ? delayMs : 600;
      const activityDelay = delayMs > 0 ? delayMs : 400;

      const [statsRes, trendsRes, activitiesRes] = await Promise.all([
        dashboardApi.getStats(statsDelay),
        dashboardApi.getTrends(trendsDelay),
        activityApi.getAll({ delay: activityDelay, limit: 8 }),
      ]);
      setStats(statsRes);
      setTrends(trendsRes);
      setLocalActivities(activitiesRes);
      setActivities(activitiesRes);

      // Compute pipeline from real stats
      const total = statsRes.totalVerifications || 1;
      const inProgress = Math.max(total - statsRes.completedChecks - statsRes.pendingCases - statsRes.highRiskFlags, 0);
      const pipelineStages: PipelineStage[] = [
        { name: 'Submitted', count: statsRes.totalVerifications, percentage: 100, color: '#6366f1' },
        { name: 'In Progress', count: inProgress + statsRes.pendingCases, percentage: Math.round(((inProgress + statsRes.pendingCases) / total) * 100), color: '#f59e0b' },
        { name: 'Pending Review', count: statsRes.pendingCases, percentage: Math.round((statsRes.pendingCases / total) * 100), color: '#ec4899' },
        { name: 'Completed', count: statsRes.completedChecks, percentage: Math.round((statsRes.completedChecks / total) * 100), color: '#10b981' },
      ];
      setPipeline(pipelineStages);

      // Fetch AI-powered insights in background
      aiInsightsApi.getInsights({
        totalVerifications: statsRes.totalVerifications,
        pendingCases: statsRes.pendingCases,
        completedChecks: statsRes.completedChecks,
        highRiskFlags: statsRes.highRiskFlags,
        successRate: statsRes.successRate,
      }).then((res) => {
        if (res.insights && res.insights.length > 0) {
          setAiInsights(res.insights);
        }
      }).catch(() => {
        // Silently fall back to default insights
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsDelayFetching(false);
    }
  }, [setActivities]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch with delay when apiDelay changes (skip initial mount)
  const prevDelayRef = useRef(0);
  useEffect(() => {
    if (prevDelayRef.current !== apiDelay) {
      prevDelayRef.current = apiDelay;
      if (apiDelay > 0) {
        fetchData(false, apiDelay);
      } else {
        fetchData(true);
      }
    }
  }, [apiDelay, fetchData]);

  // Derive pie chart data from API stats
  const PIE_DATA = stats
    ? [
        { name: 'Completed', value: stats.completedChecks, color: '#10b981' },
        { name: 'Pending', value: stats.pendingCases, color: '#f59e0b' },
        { name: 'In Progress', value: Math.round(stats.totalVerifications - stats.completedChecks - stats.pendingCases - stats.highRiskFlags), color: '#3b82f6' },
        { name: 'Flagged', value: stats.highRiskFlags, color: '#ef4444' },
      ]
    : DEFAULT_PIE_DATA;

  // Parse avg processing time from API string like "3.2 days"
  const avgProcessingDays = stats ? parseFloat(stats.avgProcessingTime) || 0 : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  // Total pie value for center label
  const totalPie = PIE_DATA.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════
          PREMIUM HEADER — Bloomberg meets Apple
          ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
      >
        <div>
          {/* Premium breadcrumb context */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 font-medium mb-2 uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            <span>VeriShield</span>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-muted-foreground/90">Command Center</span>
          </div>

          {/* Premium title with gradient */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {getGreeting()},{' '}
            <span className="aurora-text">{user?.name?.split(' ')[0]}</span>
          </h1>

          {/* Subtitle with animated gradient underline effect */}
          <div className="relative mt-2 inline-block">
            <p className="text-sm text-muted-foreground font-medium">
              {formatDate()} &middot; Your verification pipeline at a glance
            </p>
            <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-primary/40 via-amber-500/30 to-transparent" />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Check Escalations Button */}
          <button
            onClick={async () => {
              setIsCheckingEscalations(true);
              try {
                const result = await escalationApi.check();
                if (result.escalated > 0) {
                  toast({
                    title: `${result.escalated} verification(s) auto-escalated`,
                    description: result.message,
                  });
                  // Refresh data after escalation
                  fetchData(true);
                } else {
                  toast({
                    title: 'No escalations needed',
                    description: result.autoEscalationEnabled ? 'All verifications are within threshold' : 'Auto-escalation is disabled',
                  });
                }
              } catch {
                toast({ title: 'Failed to check escalations', variant: 'destructive' });
              } finally {
                setIsCheckingEscalations(false);
              }
            }}
            disabled={isCheckingEscalations}
            className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border bg-card border-border/50 text-muted-foreground hover:border-border hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isCheckingEscalations ? 'bg-amber-500/15' : 'bg-muted'}`}>
              {isCheckingEscalations ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="hidden sm:inline">{isCheckingEscalations ? 'Checking...' : 'Escalations'}</span>
          </button>

          {/* Premium API Delay Toggle */}
          <button
            onClick={() => setShowDelayPanel(!showDelayPanel)}
            className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
              showDelayPanel
                ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-500/10'
                : 'bg-card border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${showDelayPanel ? 'bg-amber-500/15' : 'bg-muted'}`}>
              <Gauge className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline">API Delay</span>
            {apiDelay > 0 && (
              <span className="ml-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 tabular-nums">
                {apiDelay}ms
              </span>
            )}
          </button>

          {/* Premium Refresh Button */}
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="btn-premium inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          API LATENCY SIMULATOR — Premium Glass Panel
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDelayPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className={`glass-premium rounded-2xl relative overflow-hidden ${apiDelay > 0 && !isDelayFetching ? 'animate-breathing' : ''}`}>
              {/* Amber gradient accent at top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.75 0.16 55 / 15%), oklch(0.65 0.16 55 / 8%))' }}>
                      <Gauge className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">API Latency Simulator</h3>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Simulate network delay</p>
                    </div>
                  </div>
                  {isDelayFetching && (
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute inline-flex h-6 w-6 rounded-full bg-amber-400/20 animate-ping" />
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin relative" />
                      </div>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                        Fetching with {apiDelay}ms delay...
                      </span>
                    </div>
                  )}
                </div>

                {/* Premium radio-style delay buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-muted-foreground/70 font-semibold uppercase tracking-wider mr-1">Delay:</span>
                  {[0, 500, 1000, 2000, 3000].map((ms) => (
                    <button
                      key={ms}
                      disabled={isDelayFetching}
                      onClick={() => setApiDelay(ms)}
                      className={`h-8 px-4 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        apiDelay === ms
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-400/30'
                          : 'bg-muted/60 text-muted-foreground border border-border/50 hover:border-border hover:bg-muted hover:text-foreground'
                      } ${isDelayFetching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {ms === 0 ? 'None' : `${ms}ms`}
                    </button>
                  ))}

                  {apiDelay > 0 && !isDelayFetching && (
                    <div className="flex items-center gap-1.5 ml-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        Simulating {apiDelay}ms latency
                      </span>
                    </div>
                  )}
                  {apiDelay === 0 && !isDelayFetching && (
                    <div className="flex items-center gap-1.5 ml-3">
                      <Zap className="w-3 h-3 text-emerald-500" />
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        No delay — instant response
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          AI INSIGHT BANNER — Premium Glass Banner
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isLoading && stats && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div
              className="card-premium rounded-2xl gradient-border cursor-pointer group overflow-hidden"
              onClick={() => navigate('credscan')}
              role="button"
              tabIndex={0}
            >
              {/* Top gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/40 via-amber-500/30 to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="p-4 flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 animate-breathing-ai" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.15 175 / 20%), oklch(0.65 0.16 55 / 12%))' }}>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">
                    AI Insight: <span className="text-gradient">{stats.highRiskFlags} high-risk flags</span> detected &middot; {stats.pendingCases} cases pending review
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    Success rate at <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.successRate}%</span> — {stats.chainVerifications} chain-sealed records
                  </p>
                </div>
                <Badge className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 flex-shrink-0">
                  CredScan AI
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          8 STAT CARDS GRID — Premium Command Center
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="Total Verifications"
          value={stats?.totalVerifications || 0}
          icon={ShieldCheck}
          change="+12.5%"
          changeType="up"
          delay={0.12}
          isLoading={isLoading}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
          glowColor="rgba(245,158,11,0.06)"
          onClick={() => navigate('records')}
        />
        <StatCard
          title="Pending Cases"
          value={stats?.pendingCases || 0}
          icon={Clock}
          change="-8.2%"
          changeType="down"
          delay={0.17}
          isLoading={isLoading}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-500"
          glowColor="rgba(245,158,11,0.06)"
          onClick={() => navigate('records')}
        />
        <StatCard
          title="Completed Checks"
          value={stats?.completedChecks || 0}
          icon={CheckCircle2}
          change="+15.3%"
          changeType="up"
          delay={0.22}
          isLoading={isLoading}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
          glowColor="rgba(16,185,129,0.06)"
          onClick={() => navigate('records')}
        />
        <StatCard
          title="High Risk Flags"
          value={stats?.highRiskFlags || 0}
          icon={AlertTriangle}
          change="+3.1%"
          changeType="up"
          delay={0.27}
          isLoading={isLoading}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          glowColor="rgba(239,68,68,0.06)"
          onClick={() => navigate('credscan')}
        />
        <StatCard
          title="Avg Processing Time"
          value={avgProcessingDays}
          icon={Timer}
          change="-0.5d"
          changeType="down"
          delay={0.32}
          isLoading={isLoading}
          suffix="d"
          decimals={1}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          glowColor="rgba(59,130,246,0.06)"
        />
        <StatCard
          title="Success Rate"
          value={stats?.successRate || 0}
          icon={TrendingUp}
          change="+2.4%"
          changeType="up"
          delay={0.37}
          isLoading={isLoading}
          suffix="%"
          decimals={1}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          glowColor="rgba(16,185,129,0.06)"
          onClick={() => navigate('dashboard')}
        />
        <StatCard
          title="Chain Sealed"
          value={stats?.chainVerifications || 0}
          icon={Link2}
          change="+18.7%"
          changeType="up"
          delay={0.42}
          isLoading={isLoading}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600"
          glowColor="rgba(147,51,234,0.06)"
          onClick={() => navigate('chainseal')}
        />
        <StatCard
          title="AI Processed"
          value={stats?.aiProcessedChecks || 0}
          icon={Brain}
          change="+24.1%"
          changeType="up"
          delay={0.47}
          isLoading={isLoading}
          iconBg="bg-violet-500/10"
          iconColor="text-violet-600"
          glowColor="rgba(139,92,246,0.06)"
          onClick={() => navigate('nexus')}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PIPELINE VISUALIZATION — Premium Flow
          ═══════════════════════════════════════════════════════════ */}
      <PipelineVisualization pipeline={pipeline} isLoading={isLoading} />

      {/* Subtle section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════════════════════════
          CHARTS SECTION — Premium Data Art
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="lg:col-span-3"
        >
          <div className="glass-premium rounded-2xl h-full">
            <div className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  Verification Trends
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +18.2% overall
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              {isLoading ? (
                <div className="skeleton-shimmer h-[300px] w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#10b981" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradFlagged" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#ef4444" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke="var(--border)"
                      strokeOpacity={0.4}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      fontWeight={500}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      fontWeight={500}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      fill="url(#gradCompleted)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#10b981' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pending"
                      stroke="#f59e0b"
                      fill="url(#gradPending)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#f59e0b' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="flagged"
                      stroke="#ef4444"
                      fill="url(#gradFlagged)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#ef4444' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {/* Premium Chart Legend */}
              {!isLoading && (
                <div className="flex items-center justify-center gap-8 mt-3">
                  {[
                    { label: 'Completed', color: '#10b981' },
                    { label: 'Pending', color: '#f59e0b' },
                    { label: 'Flagged', color: '#ef4444' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right: Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="lg:col-span-2"
        >
          <div className="glass-premium rounded-2xl h-full">
            <div className="p-6 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Status Distribution</h3>
            </div>
            <div className="px-6 pb-6">
              {isLoading ? (
                <div className="skeleton-shimmer h-[300px] w-full rounded-xl" />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={PIE_DATA}
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {PIE_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Premium Center Label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-3xl font-extrabold tabular-nums tracking-tight">{totalPie.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 w-full mt-5">
                    {PIE_DATA.map((item) => (
                      <div key={item.name} className="flex items-center gap-2.5 text-xs">
                        <div className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/10" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground font-medium">{item.name}</span>
                        <span className="font-bold ml-auto tabular-nums">{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM SECTION — Activity + AI Insights
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="lg:col-span-3"
        >
          <div className="card-premium rounded-2xl shadow-luxury h-full">
            <div className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.15 175 / 15%), oklch(0.65 0.16 55 / 10%))' }}>
                    <Activity className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Recent Activity
                </h3>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {activities.length} events
                </Badge>
              </div>
            </div>
            <div className="px-6 pb-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="skeleton-shimmer w-9 h-9 rounded-xl" />
                      <div className="flex-1">
                        <div className="skeleton-shimmer h-4 w-48 mb-1.5 rounded-md" />
                        <div className="skeleton-shimmer h-3 w-24 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-0 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {activities.slice(0, 5).map((activity, i) => {
                    const ActIcon = getActivityIcon(activity.category);
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.85 + i * 0.06 }}
                        className="flex items-start gap-3.5 py-3.5 border-b border-border/30 last:border-0 hover:bg-muted/30 -mx-2 px-3 rounded-xl transition-all duration-200 group/act"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 bg-primary/10 transition-transform duration-200 group-hover/act:scale-110" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.15 175 / 12%), oklch(0.65 0.16 55 / 8%))' }}>
                          <ActIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{activity.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-medium">{activity.userName}</span>
                            <span className="text-[6px] text-muted-foreground/40">&bull;</span>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0 font-semibold">
                          {activity.category}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* AI Insights */}
        <div className="lg:col-span-2">
          <AIInsightsCard isLoading={isLoading} insights={aiInsights} />
        </div>
      </div>
    </div>
  );
}
