'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Video,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Fingerprint,
  ScanFace,
  MonitorSmartphone,
  Wifi,
  WifiOff,
  Activity,
  Loader2,
  Ban,
  Play,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateLivenessChecks, generateInterviewSessions } from '@/lib/mock-data';
import type { LivenessCheck, InterviewSession, InterviewMonitorAlert, LivenessStatus } from '@/types';

// ---- Animation Variants ----
const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

// ---- Deepfake Score Arc Gauge (Speedometer) ----
function DeepfakeScoreGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const arcRadius = 54;
  const strokeWidth = 8;
  const arcAngle = 240;
  const arcLength = (2 * Math.PI * arcRadius * arcAngle) / 360;
  const offset = arcLength - (animated / 100) * arcLength;

  useEffect(() => {
    let start = 0;
    const dur = 1200;
    const step = score / (dur / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= score) {
        setAnimated(score);
        clearInterval(t);
      } else {
        setAnimated(Math.floor(start * 10) / 10);
      }
    }, 16);
    return () => clearInterval(t);
  }, [score]);

  const color = score < 20 ? '#22c55e' : score < 50 ? '#eab308' : '#ef4444';
  const label = score < 20 ? 'SAFE' : score < 50 ? 'SUSPICIOUS' : 'THREAT';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={130} height={80} viewBox="0 0 130 80">
          <path
            d="M 15 70 A 54 54 0 1 1 115 70"
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.15}
          />
          <motion.path
            d="M 15 70 A 54 54 0 1 1 115 70"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <motion.path
            d="M 15 70 A 54 54 0 1 1 115 70"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 5}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            opacity={0.12}
            filter="blur(3px)"
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
          <span className="text-xl font-bold tabular-nums" style={{ color }}>
            {animated.toFixed(1)}
          </span>
          <span className="text-[9px] font-bold tracking-widest" style={{ color }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---- Integrity Score Circular Progress ----
function IntegrityScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const r = 32;
  const sw = 5;
  const nr = r - sw / 2;
  const circ = 2 * Math.PI * nr;
  const offset = circ - (animated / 100) * circ;

  useEffect(() => {
    let start = 0;
    const dur = 1200;
    const step = score / (dur / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= score) {
        setAnimated(score);
        clearInterval(t);
      } else {
        setAnimated(Math.floor(start * 10) / 10);
      }
    }, 16);
    return () => clearInterval(t);
  }, [score]);

  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width={64} height={64} className="transform -rotate-90">
        <circle cx={r} cy={r} r={nr} fill="none" stroke="var(--muted)" strokeWidth={sw} opacity={0.15} />
        <motion.circle
          cx={r} cy={r} r={nr} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums" style={{ color }}>
        {animated.toFixed(0)}
      </span>
    </div>
  );
}

// ---- Alert Helpers ----
const alertLabels: Record<InterviewMonitorAlert, string> = {
  face_mismatch: 'Face Mismatch',
  multiple_faces: 'Multiple Faces',
  no_face: 'No Face',
  face_swap: 'Face Swap',
  deepfake_suspected: 'Deepfake Suspected',
  tab_switch: 'Tab Switch',
  audio_anomaly: 'Audio Anomaly',
  background_anomaly: 'Background Anomaly',
};

const alertSeverity: Record<InterviewMonitorAlert, 'critical' | 'high' | 'medium' | 'low'> = {
  deepfake_suspected: 'critical',
  face_swap: 'critical',
  face_mismatch: 'high',
  multiple_faces: 'high',
  no_face: 'high',
  audio_anomaly: 'medium',
  tab_switch: 'low',
  background_anomaly: 'medium',
};

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

// ---- Liveness Status Config ----
const livenessStatusConfig: Record<LivenessStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  passed: { label: 'Passed', color: '#22c55e', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  failed: { label: 'Failed', color: '#ef4444', bg: 'bg-red-500/10', icon: XCircle },
  suspected_spoof: { label: 'Spoof Suspected', color: '#ef4444', bg: 'bg-red-500/10', icon: AlertOctagon },
  in_progress: { label: 'In Progress', color: '#eab308', bg: 'bg-yellow-500/10', icon: Loader2 },
  not_started: { label: 'Not Started', color: '#6b7280', bg: 'bg-gray-500/10', icon: Clock },
};

// ---- Threat Level Indicator ----
function ThreatLevelIndicator({ sessions }: { sessions: InterviewSession[] }) {
  const maxScore = Math.max(...sessions.map((s) => s.deepfakeScore), 0);
  const level = maxScore > 50 ? 'CRITICAL' : maxScore > 20 ? 'ELEVATED' : 'NORMAL';
  const color = maxScore > 50 ? '#ef4444' : maxScore > 20 ? '#eab308' : '#22c55e';
  const Icon = maxScore > 50 ? ShieldAlert : maxScore > 20 ? ShieldAlert : ShieldCheck;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}>
      {level === 'CRITICAL' && (
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </motion.div>
      )}
      {level !== 'CRITICAL' && <Icon className="w-4 h-4" style={{ color }} />}
      <span className="text-xs font-bold tracking-wider" style={{ color }}>
        THREAT: {level}
      </span>
    </div>
  );
}

// ---- Main Component ----
export function DeepfakeView() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [livenessChecks, setLivenessChecks] = useState<LivenessCheck[]>([]);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [terminateSession, setTerminateSession] = useState<InterviewSession | null>(null);
  const [viewStreamSession, setViewStreamSession] = useState<InterviewSession | null>(null);
  const [livenessFilter, setLivenessFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    setSessions(generateInterviewSessions());
    setLivenessChecks(generateLivenessChecks());
  }, []);

  const liveSessions = useMemo(() => sessions.filter((s) => s.status === 'live' || s.status === 'flagged'), [sessions]);
  const activeInterviewCount = liveSessions.length;
  const threatsDetected = useMemo(() => sessions.reduce((a, s) => a + s.alertCount, 0), [sessions]);
  const deepfakeBlocks = useMemo(() => sessions.filter((s) => s.deepfakeScore > 50).length, [sessions]);
  const identityMismatches = useMemo(() => sessions.filter((s) => !s.identityVerified).length, [sessions]);

  const filteredLiveness = useMemo(() => {
    if (livenessFilter === 'all') return livenessChecks;
    return livenessChecks.filter((lc) => lc.status === livenessFilter);
  }, [livenessChecks, livenessFilter]);

  // Alert timeline items derived from session data
  const alertTimeline = useMemo(() => {
    const items: { id: string; icon: string; message: string; severity: string; timestamp: string }[] = [];
    sessions.forEach((s) => {
      if (s.deepfakeScore > 50) {
        items.push({
          id: `df-${s.id}`,
          icon: '🚨',
          message: `Deepfake suspected — ${s.candidateName} interview (${s.deepfakeScore}% deepfake score)`,
          severity: 'critical',
          timestamp: s.startTime,
        });
      }
      if (!s.identityVerified && s.status !== 'scheduled') {
        items.push({
          id: `fm-${s.id}`,
          icon: '❌',
          message: `Face mismatch — ${s.candidateName} (identity not verified)`,
          severity: 'high',
          timestamp: s.startTime,
        });
      }
      s.alerts.forEach((a, i) => {
        if (a === 'tab_switch') {
          items.push({
            id: `ts-${s.id}-${i}`,
            icon: '⚠️',
            message: `Tab switch detected — ${s.candidateName} (${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'} occurrence)`,
            severity: 'medium',
            timestamp: s.startTime,
          });
        }
      });
    });
    livenessChecks.forEach((lc) => {
      if (lc.status === 'passed') {
        items.push({
          id: `lp-${lc.id}`,
          icon: '✅',
          message: `Liveness check passed — ${lc.candidateName} (${lc.confidenceScore}% confidence)`,
          severity: 'low',
          timestamp: lc.timestamp,
        });
      }
    });
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sessions, livenessChecks]);

  // Threat intelligence breakdown
  const attackBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((s) => {
      s.alerts.forEach((a) => {
        counts[a] = (counts[a] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([type, count]) => ({ type: alertLabels[type as InterviewMonitorAlert] || type, count }))
      .sort((a, b) => b.count - a.count);
  }, [sessions]);

  const maxAttackCount = Math.max(...attackBreakdown.map((a) => a.count), 1);

  const handleTerminate = () => {
    if (!terminateSession) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === terminateSession.id ? { ...s, status: 'completed' as const } : s))
    );
    setTerminateSession(null);
    setSelectedSession(null);
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deepfake & Interview Fraud Protection</h1>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring &middot; Liveness detection &middot; Identity verification
            </p>
          </div>
        </div>
        <ThreatLevelIndicator sessions={sessions} />
      </motion.div>

      {/* ========== STATS ROW ========== */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Interviews', value: activeInterviewCount, icon: Video, color: '#22c55e', dot: true },
          { label: 'Threats Detected', value: threatsDetected, icon: AlertTriangle, color: '#f97316' },
          { label: 'Deepfake Blocks', value: deepfakeBlocks, icon: ShieldAlert, color: '#ef4444' },
          { label: 'Identity Mismatches', value: identityMismatches, icon: UserX, color: '#eab308' },
        ].map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={fadeInUp}>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${stat.color}12` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">{stat.value}</span>
                    {stat.dot && (
                      <motion.span
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate block">{stat.label}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ========== TABS ========== */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="live" className="gap-1.5 text-xs sm:text-sm">
            <Wifi className="w-3.5 h-3.5" /> Live Interviews
          </TabsTrigger>
          <TabsTrigger value="liveness" className="gap-1.5 text-xs sm:text-sm">
            <ScanFace className="w-3.5 h-3.5" /> Liveness Results
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5 text-xs sm:text-sm">
            <AlertOctagon className="w-3.5 h-3.5" /> Alert Timeline
          </TabsTrigger>
        </TabsList>

        {/* ========== LIVE INTERVIEWS TAB ========== */}
        <TabsContent value="live" className="mt-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {liveSessions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-border/50 border-dashed">
                  <CardContent className="p-12 text-center">
                    <WifiOff className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No active interview sessions</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              liveSessions.map((session, i) => {
                const isLive = session.status === 'live';
                const isFlagged = session.status === 'flagged';
                const isCritical = session.deepfakeScore > 50;
                const isSelected = selectedSession?.id === session.id;

                return (
                  <motion.div
                    key={session.id}
                    custom={i}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    layout
                  >
                    <Card
                      className={`bg-card/50 backdrop-blur-sm border transition-all cursor-pointer ${
                        isFlagged
                          ? 'border-red-500/40 hover:border-red-500/60'
                          : isCritical
                          ? 'border-amber-500/40 hover:border-amber-500/60'
                          : 'border-border/50 hover:border-primary/30'
                      }`}
                      onClick={() => setSelectedSession(isSelected ? null : session)}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Left: session info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  {session.candidateName.charAt(0)}
                                </span>
                              </div>
                              <motion.span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                                  isLive ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                                animate={isFlagged ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1.2 }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold truncate">{session.candidateName}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold px-2 ${
                                    isLive
                                      ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5'
                                      : 'border-red-500/50 text-red-500 bg-red-500/5'
                                  }`}
                                >
                                  {isLive ? 'LIVE' : 'FLAGGED'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {session.position} &middot; {formatDuration(session.duration)}
                              </p>
                            </div>
                          </div>

                          {/* Center: Identity & Liveness badges */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {session.identityVerified ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                                  <UserCheck className="w-3 h-3" /> ID Verified
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] gap-1">
                                  <UserX className="w-3 h-3" /> ID Failed
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {session.livenessPassed ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                                  <Fingerprint className="w-3 h-3" /> Liveness OK
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-1">
                                  <Fingerprint className="w-3 h-3" /> Liveness Fail
                                </Badge>
                              )}
                            </div>
                            {session.alertCount > 0 && (
                              <Badge
                                className={`text-[10px] gap-1 ${
                                  isCritical
                                    ? 'bg-red-500/10 text-red-600 border-red-500/20 animate-pulse'
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3" /> {session.alertCount} alert{session.alertCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>

                          {/* Right: Gauges */}
                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="text-center">
                              <p className="text-[9px] font-medium text-muted-foreground mb-1 tracking-wide uppercase">Deepfake Score</p>
                              <DeepfakeScoreGauge score={session.deepfakeScore} />
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] font-medium text-muted-foreground mb-1 tracking-wide uppercase">Integrity</p>
                              <IntegrityScoreRing score={session.integrityScore} />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Alerts */}
                        <AnimatePresence>
                          {isSelected && session.alerts.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Detected Anomalies</p>
                                {session.alerts.map((alert, j) => {
                                  const sev = alertSeverity[alert];
                                  return (
                                    <motion.div
                                      key={`${alert}-${j}`}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: j * 0.05 }}
                                      className="flex items-center gap-2 text-xs"
                                    >
                                      <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: severityColors[sev] }}
                                      />
                                      <span
                                        className="font-medium"
                                        style={{ color: severityColors[sev] }}
                                      >
                                        {alertLabels[alert]}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] px-1.5 py-0 capitalize"
                                        style={{
                                          borderColor: `${severityColors[sev]}40`,
                                          color: severityColors[sev],
                                        }}
                                      >
                                        {sev}
                                      </Badge>
                                    </motion.div>
                                  );
                                })}
                                <div className="flex gap-2 pt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs gap-1.5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewStreamSession(session);
                                    }}
                                  >
                                    <Play className="w-3 h-3" /> View Stream
                                  </Button>
                                  {isFlagged && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="text-xs gap-1.5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTerminateSession(session);
                                      }}
                                    >
                                      <Ban className="w-3 h-3" /> Terminate
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          {/* Completed / Scheduled sessions summary */}
          {sessions.filter((s) => s.status === 'completed' || s.status === 'scheduled').length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Other Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sessions
                      .filter((s) => s.status === 'completed' || s.status === 'scheduled')
                      .map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-[10px] font-bold text-muted-foreground">{s.candidateName.charAt(0)}</span>
                            </div>
                            <div>
                              <span className="text-xs font-medium">{s.candidateName}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">{s.position}</span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              s.status === 'scheduled'
                                ? 'border-blue-400/40 text-blue-500'
                                : 'border-emerald-400/40 text-emerald-600'
                            }`}
                          >
                            {s.status === 'scheduled' ? 'Scheduled' : 'Completed'}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* ========== LIVENESS RESULTS TAB ========== */}
        <TabsContent value="liveness" className="mt-4 space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Filter:</span>
            {['all', 'passed', 'failed', 'suspected_spoof', 'in_progress'].map((f) => (
              <Button
                key={f}
                size="sm"
                variant={livenessFilter === f ? 'default' : 'outline'}
                className="text-[11px] h-7 px-3 capitalize"
                onClick={() => setLivenessFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'suspected_spoof' ? 'Spoof' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          {/* Liveness check cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredLiveness.map((lc, i) => {
                const config = livenessStatusConfig[lc.status];
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={lc.id}
                    custom={i}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    layout
                  >
                    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-shadow h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <ScanFace className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{lc.candidateName}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{lc.verificationId}</p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 font-semibold"
                            style={{
                              borderColor: `${config.color}40`,
                              color: config.color,
                              backgroundColor: `${config.color}08`,
                            }}
                          >
                            {lc.status === 'in_progress' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <StatusIcon className="w-3 h-3" />
                            )}
                            {config.label}
                          </Badge>
                        </div>

                        {/* Challenge type */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Challenge:</span>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {lc.challengeType.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* Scores */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Confidence Score</p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={lc.confidenceScore}
                                className="h-2 flex-1"
                              />
                              <span
                                className="text-xs font-bold tabular-nums w-10 text-right"
                                style={{
                                  color:
                                    lc.confidenceScore >= 80
                                      ? '#22c55e'
                                      : lc.confidenceScore >= 50
                                      ? '#eab308'
                                      : '#ef4444',
                                }}
                              >
                                {lc.confidenceScore}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Face Match Score</p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={lc.faceMatchScore}
                                className="h-2 flex-1"
                              />
                              <span
                                className="text-xs font-bold tabular-nums w-10 text-right"
                                style={{
                                  color:
                                    lc.faceMatchScore >= 80
                                      ? '#22c55e'
                                      : lc.faceMatchScore >= 50
                                      ? '#eab308'
                                      : '#ef4444',
                                }}
                              >
                                {lc.faceMatchScore}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Verification badges */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            className={`text-[10px] gap-1 ${
                              lc.aadhaarVerified
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 border-red-500/20'
                            }`}
                          >
                            {lc.aadhaarVerified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            Aadhaar
                          </Badge>
                          <Badge
                            className={`text-[10px] gap-1 ${
                              lc.panVerified
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 border-red-500/20'
                            }`}
                          >
                            {lc.panVerified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            PAN
                          </Badge>
                        </div>

                        {/* Alerts */}
                        {lc.alerts.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1.5">Alerts</p>
                            <div className="flex flex-wrap gap-1.5">
                              {lc.alerts.map((a, j) => (
                                <span
                                  key={`${a}-${j}`}
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: `${severityColors[alertSeverity[a]]}12`,
                                    color: severityColors[alertSeverity[a]],
                                  }}
                                >
                                  {alertLabels[a]}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-muted-foreground mt-2">{timeAgo(lc.timestamp)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* ========== ALERT TIMELINE TAB ========== */}
        <TabsContent value="alerts" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline feed */}
            <div className="lg:col-span-2">
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Real-Time Alert Feed
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Detected anomalies from live interviews and liveness checks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                    <AnimatePresence>
                      {alertTimeline.map((item, i) => {
                        const sevColor = severityColors[item.severity] || '#6b7280';
                        return (
                          <motion.div
                            key={item.id}
                            custom={i}
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            className="flex items-start gap-3 p-3 rounded-xl border border-border/50 hover:bg-accent/30 transition-colors"
                            style={{ borderLeftWidth: 3, borderLeftColor: sevColor }}
                          >
                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs leading-relaxed">{item.message}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-muted-foreground">{timeAgo(item.timestamp)}</span>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 capitalize"
                                  style={{ borderColor: `${sevColor}40`, color: sevColor }}
                                >
                                  {item.severity}
                                </Badge>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    {alertTimeline.length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No alerts detected — all clear
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Threat Intelligence Panel */}
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MonitorSmartphone className="w-4 h-4 text-primary" />
                    Attack Vectors
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Common fraud patterns detected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {attackBreakdown.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No attacks detected</p>
                    ) : (
                      attackBreakdown.map((item, i) => {
                        const pct = (item.count / maxAttackCount) * 100;
                        const keys = Object.keys(alertSeverity) as InterviewMonitorAlert[];
                        const alertKey = keys.find((k) => alertLabels[k] === item.type);
                        const sev = alertKey ? alertSeverity[alertKey] : 'medium';
                        const sevColor = severityColors[sev];

                        return (
                          <motion.div
                            key={item.type}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{item.type}</span>
                              <span className="text-[10px] font-bold" style={{ color: sevColor }}>
                                {item.count}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: sevColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                              />
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Alert Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Critical', count: alertTimeline.filter((a) => a.severity === 'critical').length, color: '#ef4444' },
                      { label: 'High', count: alertTimeline.filter((a) => a.severity === 'high').length, color: '#f97316' },
                      { label: 'Medium', count: alertTimeline.filter((a) => a.severity === 'medium').length, color: '#eab308' },
                      { label: 'Low', count: alertTimeline.filter((a) => a.severity === 'low').length, color: '#22c55e' },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl"
                        style={{ backgroundColor: `${s.color}08` }}
                      >
                        <span className="text-xl font-bold tabular-nums" style={{ color: s.color }}>
                          {s.count}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Trend - Simple visual bar chart */}
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Risk Trend (7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1.5 h-24">
                    {[35, 22, 48, 15, 62, 38, 28].map((val, i) => {
                      const h = (val / 100) * 100;
                      const color = val > 50 ? '#ef4444' : val > 25 ? '#eab308' : '#22c55e';
                      return (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{ backgroundColor: color, minHeight: 4 }}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                      <span key={d} className="flex-1 text-[9px] text-muted-foreground text-center">
                        {d}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ========== TERMINATE CONFIRMATION DIALOG ========== */}
      <Dialog open={!!terminateSession} onOpenChange={(open) => !open && setTerminateSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Terminate Interview Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate the interview session for{' '}
              <strong>{terminateSession?.candidateName}</strong>? This action cannot be undone. The candidate
              will be disconnected immediately.
            </DialogDescription>
          </DialogHeader>
          {terminateSession && (
            <div className="py-3 px-4 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1.5">
              <p className="text-xs font-medium text-red-600">Session Details:</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Position: {terminateSession.position}</p>
                <p>Deepfake Score: {terminateSession.deepfakeScore}%</p>
                <p>Alerts: {terminateSession.alertCount}</p>
                <p>
                  Alerts Types: {terminateSession.alerts.map((a) => alertLabels[a]).join(', ')}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setTerminateSession(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleTerminate} className="gap-1.5">
              <Ban className="w-3.5 h-3.5" /> Terminate Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Stream Dialog */}
      <Dialog open={viewStreamSession !== null} onOpenChange={(open) => { if (!open) setViewStreamSession(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Live Stream - {viewStreamSession?.candidateName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mock video player */}
            <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }}
                animate={{ y: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <div className="flex items-center gap-2 z-10">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
                <span className="text-white text-sm font-bold tracking-wider">LIVE</span>
              </div>
              <div className="absolute bottom-2 right-2 text-white/50 text-[10px] font-mono">
                {viewStreamSession?.candidateName} · Interview Monitor
              </div>
            </div>

            {/* Session details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Position</p>
                <p className="font-medium">{viewStreamSession?.position}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Duration</p>
                <p className="font-medium">{viewStreamSession ? formatDuration(viewStreamSession.duration) : ''}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Deepfake Score</p>
                <p className="font-medium" style={{ color: (viewStreamSession?.deepfakeScore ?? 0) > 50 ? '#ef4444' : (viewStreamSession?.deepfakeScore ?? 0) > 20 ? '#eab308' : '#22c55e' }}>{viewStreamSession?.deepfakeScore}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Integrity Score</p>
                <p className="font-medium" style={{ color: (viewStreamSession?.integrityScore ?? 0) >= 80 ? '#22c55e' : (viewStreamSession?.integrityScore ?? 0) >= 50 ? '#eab308' : '#ef4444' }}>{viewStreamSession?.integrityScore}%</p>
              </div>
              {(viewStreamSession?.alertCount ?? 0) > 0 && (
                <div className="col-span-2 space-y-1">
                  <p className="text-muted-foreground text-xs">Alerts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewStreamSession?.alerts.map((alert, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] capitalize" style={{ borderColor: `${severityColors[alertSeverity[alert]]}40`, color: severityColors[alertSeverity[alert]] }}>
                        {alertLabels[alert]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStreamSession(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
