'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Brain,
  Clock,
  AlertTriangle,
  MessageSquare,
  Zap,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Activity,
  Send,
  FileText,
  Shield,
  Loader2,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Eye,
  Timer,
  AlertCircle,
  Flame,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateArinTasks, generateArinWorkflows } from '@/lib/mock-data';
import type { ArinTask, ArinWorkflow, ArinAgentStatus } from '@/types';

// ---- Config Maps ----
const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  high: { color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  medium: { color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  low: { color: '#22c55e', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
};

const taskTypeIcon: Record<string, React.ElementType> = {
  sla_prediction: Timer,
  auto_escalation: AlertTriangle,
  candidate_communication: Send,
  verification_lifecycle: Activity,
  anomaly_detection: AlertCircle,
  report_generation: FileText,
};

const stageStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  completed: { color: '#22c55e', bg: 'bg-emerald-500/15', label: 'Completed' },
  in_progress: { color: '#f59e0b', bg: 'bg-amber-500/15', label: 'In Progress' },
  pending: { color: '#6b7280', bg: 'bg-gray-500/10', label: 'Pending' },
  failed: { color: '#ef4444', bg: 'bg-red-500/15', label: 'Failed' },
  skipped: { color: '#9ca3af', bg: 'bg-gray-400/10', label: 'Skipped' },
};

const slaStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  on_track: { color: '#22c55e', bg: 'bg-emerald-500/10', label: 'On Track' },
  at_risk: { color: '#f59e0b', bg: 'bg-amber-500/10', label: 'At Risk' },
  breached: { color: '#ef4444', bg: 'bg-red-500/10', label: 'Breached' },
};

// ---- Decision Log Mock ----
interface DecisionEntry {
  id: string;
  timestamp: string;
  type: 'escalation' | 'communication' | 'anomaly' | 'report' | 'lifecycle';
  description: string;
  icon: React.ElementType;
  color: string;
}

function generateDecisionLog(): DecisionEntry[] {
  const now = new Date();
  return [
    {
      id: 'd1',
      timestamp: new Date(now.getTime() - 12 * 60000).toISOString(),
      type: 'escalation',
      description: 'Escalated MPC-001038 to senior verifier — SLA breach predicted',
      icon: AlertTriangle,
      color: '#f97316',
    },
    {
      id: 'd2',
      timestamp: new Date(now.getTime() - 28 * 60000).toISOString(),
      type: 'communication',
      description: 'Sent consent request to Priya Sharma via WhatsApp',
      icon: Send,
      color: '#3b82f6',
    },
    {
      id: 'd3',
      timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
      type: 'anomaly',
      description: 'Flagged employment overlap in Rahul Verma\'s history',
      icon: AlertCircle,
      color: '#ef4444',
    },
    {
      id: 'd4',
      timestamp: new Date(now.getTime() - 67 * 60000).toISOString(),
      type: 'report',
      description: 'Auto-generated report for batch BGV-2024-089',
      icon: FileText,
      color: '#8b5cf6',
    },
    {
      id: 'd5',
      timestamp: new Date(now.getTime() - 95 * 60000).toISOString(),
      type: 'lifecycle',
      description: 'Advanced Arjun Mehta verification from Identity → Employment stage',
      icon: Activity,
      color: '#22c55e',
    },
    {
      id: 'd6',
      timestamp: new Date(now.getTime() - 130 * 60000).toISOString(),
      type: 'escalation',
      description: 'Auto-escalated court check delay for MPC-001038 — 48hr SLA window',
      icon: AlertTriangle,
      color: '#f97316',
    },
    {
      id: 'd7',
      timestamp: new Date(now.getTime() - 180 * 60000).toISOString(),
      type: 'communication',
      description: 'Sent document upload reminder to Ananya Desai via WhatsApp',
      icon: Send,
      color: '#3b82f6',
    },
    {
      id: 'd8',
      timestamp: new Date(now.getTime() - 240 * 60000).toISOString(),
      type: 'anomaly',
      description: 'Detected duplicate PAN submission for Vikram Patel (Aadhaar mismatch)',
      icon: AlertCircle,
      color: '#ef4444',
    },
  ];
}

// ---- Helpers ----
function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatSLACountdown(iso: string): { text: string; overdue: boolean } {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { text: `${Math.abs(Math.floor(diff / 3600000))}h overdue`, overdue: true };
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 24) return { text: `${Math.floor(hrs / 24)}d ${hrs % 24}h`, overdue: false };
  return { text: `${hrs}h ${mins}m`, overdue: false };
}

// ---- Stat Card ----
function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  trendUp,
  color,
  index,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-all duration-300 group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            {trend && (
              <div
                className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${
                  trendUp ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
                }`}
              >
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend}
              </div>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---- Workflow Pipeline ----
function WorkflowPipeline({ workflow, expanded, onToggle }: { workflow: ArinWorkflow; expanded: boolean; onToggle: () => void }) {
  const slaCfg = slaStatusConfig[workflow.slaStatus];
  const isAtRisk = workflow.slaStatus === 'at_risk' || workflow.slaStatus === 'breached';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border transition-all duration-300 ${
        isAtRisk ? 'border-red-500/30 shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)]' : 'border-border/50'
      }`}
    >
      {/* Workflow Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-4 hover:bg-accent/30 rounded-t-xl transition-colors"
      >
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{workflow.candidateName}</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {workflow.verificationId}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold"
              style={{ borderColor: slaCfg.color, color: slaCfg.color, backgroundColor: `${slaCfg.color}10` }}
            >
              {slaCfg.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 max-w-xs">
              <Progress value={workflow.overallProgress} className="h-1.5" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">{workflow.overallProgress}%</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ETA {new Date(workflow.predictedCompletion).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Stages */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Visual Pipeline Stepper */}
              <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-2">
                {workflow.stages.map((stage, i) => {
                  const cfg = stageStatusConfig[stage.status];
                  const Icon =
                    stage.status === 'completed' ? CheckCircle2 :
                    stage.status === 'failed' ? XCircle :
                    stage.status === 'in_progress' ? Loader2 :
                    Clock;

                  return (
                    <div key={i} className="flex items-center flex-shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-1.5 px-2">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                                  stage.status === 'in_progress' ? 'animate-pulse' : ''
                                }`}
                                style={{
                                  borderColor: cfg.color,
                                  backgroundColor: cfg.bg,
                                }}
                              >
                                <Icon
                                  className={`w-4 h-4 ${stage.status === 'in_progress' ? 'animate-spin' : ''}`}
                                  style={{ color: cfg.color }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight max-w-[72px]">
                                {stage.name}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                            <p className="font-semibold">{stage.name}</p>
                            <p>Status: {cfg.label}</p>
                            {stage.duration && <p>Duration: {stage.duration}</p>}
                            {stage.assignee && <p>Assignee: {stage.assignee}</p>}
                            {stage.notes && <p className="text-amber-500 mt-1">{stage.notes}</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {i < workflow.stages.length - 1 && (
                        <div
                          className="w-6 h-0.5 mx-1 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor: stage.status === 'completed' ? '#22c55e' : '#374151',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Stage Detail Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {workflow.stages.map((stage, i) => {
                  const cfg = stageStatusConfig[stage.status];
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-border/30 text-xs space-y-1"
                      style={{ borderLeftWidth: 3, borderLeftColor: cfg.color }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{stage.name}</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0"
                          style={{ borderColor: cfg.color, color: cfg.color }}
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                      {stage.assignee && (
                        <p className="text-muted-foreground">By: {stage.assignee}</p>
                      )}
                      {stage.duration && (
                        <p className="text-muted-foreground">Time: {stage.duration}</p>
                      )}
                      {stage.notes && (
                        <p className="text-amber-500 font-medium">{stage.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- Task Row ----
function TaskRow({
  task,
  onExecute,
  onDismiss,
  agentPaused,
}: {
  task: ArinTask;
  onExecute: (id: string) => void;
  onDismiss: (id: string) => void;
  agentPaused: boolean;
}) {
  const priCfg = priorityConfig[task.priority];
  const TypeIcon = taskTypeIcon[task.type] || Bot;
  const slaInfo = task.slaDeadline ? formatSLACountdown(task.slaDeadline) : null;
  const isRunning = task.status === 'running';
  const isCompleted = task.status === 'completed';
  const isError = task.status === 'error';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`p-3.5 rounded-xl border transition-all duration-200 hover:shadow-sm ${
        isRunning
          ? 'border-primary/30 bg-primary/[0.03]'
          : isError
            ? 'border-red-500/30 bg-red-500/[0.03]'
            : isCompleted
              ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
              : 'border-border/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isRunning ? 'animate-pulse' : ''
          }`}
          style={{ backgroundColor: `${priCfg.color}15` }}
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: priCfg.color }} />
          ) : isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : isError ? (
            <XCircle className="w-4 h-4 text-red-500" />
          ) : (
            <TypeIcon className="w-4 h-4" style={{ color: priCfg.color }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{task.title}</span>
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold capitalize ${priCfg.bg} ${priCfg.border}`}
              style={{ borderColor: priCfg.color, color: priCfg.color }}
            >
              {task.priority}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${
                task.status === 'running'
                  ? 'border-primary/40 text-primary bg-primary/10'
                  : task.status === 'completed'
                    ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                    : task.status === 'error'
                      ? 'border-red-500/40 text-red-500 bg-red-500/10'
                      : task.status === 'paused'
                        ? 'border-amber-500/40 text-amber-600 bg-amber-500/10'
                        : 'border-border/50 text-muted-foreground'
              }`}
            >
              {task.status === 'running' && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {task.status}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>

          {/* Progress + Meta Row */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 max-w-[160px]">
              <Progress
                value={task.progress}
                className={`h-1.5 ${isCompleted ? '[&>[data-slot=progress-indicator]]:bg-emerald-500' : ''}`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{task.progress}%</span>

            {task.candidateName && (
              <>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {task.candidateName}
                </span>
              </>
            )}

            {task.verificationId && (
              <>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {task.verificationId.slice(0, 14)}
                </span>
              </>
            )}
          </div>

          {/* SLA Deadline */}
          {slaInfo && (
            <div className="mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" style={{ color: slaInfo.overdue ? '#ef4444' : '#6b7280' }} />
              <span
                className="text-[10px] font-medium"
                style={{ color: slaInfo.overdue ? '#ef4444' : '#6b7280' }}
              >
                SLA: {slaInfo.text}
              </span>
              {task.predictedDelay && (
                <span className="text-[10px] text-amber-500 ml-1">
                  (+{task.predictedDelay}h predicted delay)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isCompleted && !isRunning && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] gap-1 px-2.5"
                    onClick={() => onExecute(task.id)}
                    disabled={agentPaused}
                  >
                    <Play className="w-3 h-3" />
                    Execute
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {agentPaused ? 'Agent paused' : 'Run this task now'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isCompleted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 px-2.5 text-emerald-600" disabled>
                    <CheckCircle2 className="w-3 h-3" />
                    Done
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Task completed successfully</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!isCompleted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] px-2 text-muted-foreground" onClick={() => onDismiss(task.id)}>
                    Dismiss
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Dismiss this task</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---- Decision Timeline Entry ----
function DecisionEntry({ entry, index }: { entry: DecisionEntry; index: number }) {
  const Icon = entry.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex gap-3 group"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110"
          style={{ borderColor: entry.color, backgroundColor: `${entry.color}10` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: entry.color }} />
        </div>
        <div className="w-px h-full min-h-[16px] bg-border/40" />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-sm leading-relaxed">{entry.description}</p>
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formatTimeAgo(entry.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

// ---- Main Component ----
export function ArinView() {
  const [agentActive, setAgentActive] = useState(true);
  const [tasks, setTasks] = useState<ArinTask[]>(() => generateArinTasks(12));
  const [workflows] = useState<ArinWorkflow[]>(() => generateArinWorkflows());
  const [decisions] = useState<DecisionEntry[]>(() => generateDecisionLog());
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [executingTasks, setExecutingTasks] = useState<Set<string>>(new Set());
  const [livePulse, setLivePulse] = useState(false);

  // Simulated live pulse every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 800);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    return tasks.filter((t) => t.status === taskFilter);
  }, [tasks, taskFilter]);

  // Compute stats
  const stats = useMemo(() => {
    const running = tasks.filter((t) => t.status === 'running').length;
    const atRisk = workflows.filter((w) => w.slaStatus === 'at_risk' || w.slaStatus === 'breached').length;
    const onTrack = workflows.filter((w) => w.slaStatus === 'on_track').length;
    const escalations = tasks.filter(
      (t) => t.type === 'auto_escalation' && t.status !== 'completed'
    ).length;
    const messages = tasks.filter(
      (t) => t.type === 'candidate_communication'
    ).length;
    return { running, atRisk, onTrack, escalations, messages };
  }, [tasks, workflows]);

  // Dismiss a task
  const handleDismiss = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  // Execute a task
  const handleExecute = useCallback((taskId: string) => {
    setExecutingTasks((prev) => new Set(prev).add(taskId));
    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: 'completed' as ArinAgentStatus, progress: 100 } : t
        )
      );
      setExecutingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }, 1800);
  }, []);

  const toggleWorkflow = (id: string) => {
    setExpandedWorkflow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Paused Banner */}
      <AnimatePresence>
        {!agentActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <Pause className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Agent is paused — tasks will not be processed automatically</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Header Section ===== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            {/* Animated pulse ring */}
            {agentActive ? (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-primary/40"
                animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
            ) : null}
            {/* Live dot */}
            {agentActive ? (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ) : (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-background" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Arin AI Agent</h1>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold gap-1 ${
                  agentActive
                    ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                    : 'border-amber-500/40 text-amber-600 bg-amber-500/10'
                }`}
              >
                {agentActive ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3" />
                    Paused
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Autonomous workflow orchestration · SLA prediction · Smart escalation
            </p>
          </div>
        </div>

        {/* Agent Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              {agentActive ? 'Agent Running' : 'Agent Paused'}
            </span>
            <Switch checked={agentActive} onCheckedChange={setAgentActive} />
          </div>
          {agentActive ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      livePulse
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border/50 bg-card/50 text-muted-foreground'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {livePulse ? 'Syncing data...' : 'Auto-refresh every 5s'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/30 bg-card/30 text-muted-foreground/40">
                    <Zap className="w-4 h-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Sync paused — agent is inactive</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </motion.div>

      {/* ===== Agent Stats Row ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Activity}
          value={stats.running}
          label="Active Tasks"
          trend="+3"
          trendUp={true}
          color="#3b82f6"
          index={0}
        />
        <StatCard
          icon={Timer}
          value={`${stats.onTrack}/${stats.atRisk + stats.onTrack}`}
          label="SLA Predictions"
          trend={stats.atRisk > 0 ? `${stats.atRisk} at risk` : 'All clear'}
          trendUp={stats.atRisk === 0}
          color="#f59e0b"
          index={1}
        />
        <StatCard
          icon={Flame}
          value={stats.escalations}
          label="Auto-Escalations"
          trend="+1"
          trendUp={false}
          color="#f97316"
          index={2}
        />
        <StatCard
          icon={MessageSquare}
          value={stats.messages}
          label="Candidate Messages"
          trend="+5"
          trendUp={true}
          color="#8b5cf6"
          index={3}
        />
      </div>

      {/* ===== Tabs: Workflows / Task Queue / Decision Log ===== */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="workflows" className="gap-1.5 text-xs">
            <Shield className="w-3.5 h-3.5" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5" />
            Task Queue
          </TabsTrigger>
          <TabsTrigger value="decisions" className="gap-1.5 text-xs">
            <Eye className="w-3.5 h-3.5" />
            Decision Log
          </TabsTrigger>
        </TabsList>

        {/* ===== Active Workflows Panel ===== */}
        <TabsContent value="workflows">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Active Verification Workflows</h2>
                <Badge variant="outline" className="text-[10px]">
                  {workflows.length} active
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {workflows.map((wf) => (
                <WorkflowPipeline
                  key={wf.id}
                  workflow={wf}
                  expanded={expandedWorkflow === wf.id}
                  onToggle={() => toggleWorkflow(wf.id)}
                />
              ))}
            </div>

            {/* Pipeline Legend */}
            <div className="flex items-center gap-4 flex-wrap px-1 pt-2">
              <span className="text-[10px] text-muted-foreground font-medium">Legend:</span>
              {Object.entries(stageStatusConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* ===== Task Queue ===== */}
        <TabsContent value="tasks">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-semibold">Task Queue</h2>
              <div className="flex items-center gap-1.5">
                {['all', 'running', 'completed', 'idle', 'error'].map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={taskFilter === filter ? 'default' : 'outline'}
                    className="h-7 text-[11px] px-2.5 capitalize"
                    onClick={() => setTaskFilter(filter)}
                  >
                    {filter === 'all' ? `All (${tasks.length})` : filter}
                  </Button>
                ))}
              </div>
            </div>

            {/* Task List */}
            <ScrollArea className="max-h-[520px]">
              <AnimatePresence mode="popLayout">
                <div className="space-y-2 pr-1">
                  {filteredTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={
                        executingTasks.has(task.id)
                          ? { ...task, status: 'running' as ArinAgentStatus, progress: Math.min(task.progress + 30, 90) }
                          : task
                      }
                      onExecute={handleExecute}
                      onDismiss={handleDismiss}
                      agentPaused={!agentActive}
                    />
                  ))}
                  {filteredTasks.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No tasks matching filter &quot;{taskFilter}&quot;</p>
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
            </ScrollArea>
          </motion.div>
        </TabsContent>

        {/* ===== AI Decision Log ===== */}
        <TabsContent value="decisions">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Decision Log
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {decisions.length} decisions
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Live
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Automated decisions made by Arin AI in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[480px]">
                  <div className="space-y-0 pr-2">
                    {decisions.map((entry, i) => (
                      <DecisionEntry key={entry.id} entry={entry} index={i} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ===== Footer ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground pt-2 pb-4 gap-2"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Powered by Arin AI Agent Engine</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            ISO 27001 Compliant
          </span>
          <span className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Model v3.2.1
          </span>
        </div>
      </motion.div>
    </div>
  );
}
