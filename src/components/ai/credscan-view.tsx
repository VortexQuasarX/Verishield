'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Loader2,
  Sparkles,
  Fingerprint,
  FileWarning,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { generateAIRiskAnalysis } from '@/lib/mock-data';
import { aiRiskApi } from '@/lib/api';
import type { AIRiskAnalysis, RiskFactor } from '@/types';

// ---- Risk Score Gauge (SVG) — Premium ----
function RiskScoreGauge({ score }: { score: number }) {
  const radius = 72;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = score / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  const getColor = (s: number) => {
    if (s < 30) return '#22c55e';
    if (s < 60) return '#eab308';
    if (s < 80) return '#f97316';
    return '#ef4444';
  };

  const getLabel = (s: number) => {
    if (s < 30) return 'Low Risk';
    if (s < 60) return 'Moderate Risk';
    if (s < 80) return 'High Risk';
    return 'Critical Risk';
  };

  const color = getColor(score);

  // Premium gradient ID based on risk level
  const gradientId = `risk-gradient-${score}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative animate-pulse-glow">
        <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
            opacity={0.15}
          />
          <motion.circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          <motion.circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth + 8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            opacity={0.12}
            filter="blur(6px)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold tabular-nums tracking-tight"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {animatedScore}
          </motion.span>
          <span className="text-xs text-muted-foreground font-medium tabular-nums">/ 100</span>
        </div>
      </div>
      <Badge
        variant="outline"
        className="text-xs font-semibold px-3 py-1 animate-pulse-glow"
        style={{ borderColor: color, color, backgroundColor: `${color}10` }}
      >
        {getLabel(score)}
      </Badge>
    </div>
  );
}

// ---- Severity Config ----
const severityConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  low: { color: '#22c55e', bg: 'bg-emerald-500/10', icon: Info },
  medium: { color: '#eab308', bg: 'bg-yellow-500/10', icon: AlertTriangle },
  high: { color: '#f97316', bg: 'bg-orange-500/10', icon: FileWarning },
  critical: { color: '#ef4444', bg: 'bg-red-500/10', icon: ShieldAlert },
};

// ---- Animation Variants ----
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

// ---- Premium Gradient Progress Bar ----
function GradientProgress({ value, color, className }: { value: number; color: string; className?: string }) {
  return (
    <div className={`relative h-1.5 w-full overflow-hidden rounded-full bg-muted/30 ${className || ''}`}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full opacity-30"
        style={{
          background: `linear-gradient(90deg, transparent, ${color})`,
          filter: 'blur(3px)',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

// ---- Risk Factor Card — Premium ----
function RiskFactorCard({
  factor,
  index,
  isExpanded,
  onToggle,
  isResolved,
  onEscalate,
  onResolve,
}: {
  factor: RiskFactor;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isResolved: boolean;
  onEscalate: () => void;
  onResolve: () => void;
}) {
  const config = severityConfig[factor.severity] || severityConfig.low;
  const Icon = config.icon;
  const confidencePct = Math.round(factor.confidence * 100);
  const [notes, setNotes] = useState('');

  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={`card-premium rounded-xl transition-all cursor-pointer ${
        isResolved ? 'opacity-60' : 'hover:shadow-luxury'
      }`}
      style={{ borderLeftWidth: 3, borderLeftColor: isResolved ? '#9ca3af' : config.color }}
      onClick={onToggle}
    >
      <div className="flex items-start gap-4 p-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg} shadow-sm`}>
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold tracking-tight ${isResolved ? 'line-through text-muted-foreground' : ''}`}>{factor.category}</span>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold capitalize px-2 py-0"
              style={{ borderColor: isResolved ? '#9ca3af' : config.color, color: isResolved ? '#9ca3af' : config.color }}
            >
              {isResolved ? 'Resolved' : factor.severity}
            </Badge>
            <div className="ml-auto">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${isResolved ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>{factor.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Confidence</span>
            <div className="flex-1 max-w-[120px]">
              <GradientProgress value={confidencePct} color={isResolved ? '#9ca3af' : config.color} />
            </div>
            <span className="text-[10px] font-semibold tabular-nums" style={{ color: isResolved ? '#9ca3af' : config.color }}>
              {confidencePct}%
            </span>
          </div>
        </div>
      </div>
      {/* Expanded Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/20 mt-1">
              <textarea
                className="w-full min-h-[60px] rounded-md border border-border/30 bg-muted/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none mt-3 transition-colors focus:bg-background"
                placeholder="Add notes about this risk factor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  className="h-7 text-[11px] gap-1 px-3 btn-premium-gold"
                  onClick={onEscalate}
                  disabled={isResolved}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Escalate
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[11px] gap-1 px-3 btn-premium"
                  onClick={onResolve}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Mark Resolved
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- Candidate Suggestions ----
const CANDIDATES = [
  'Arjun Mehta', 'Priya Sharma', 'Rahul Verma', 'Ananya Desai', 'Vikram Patel',
  'Sneha Kulkarni', 'Rohan Gupta', 'Ishaan Reddy', 'Kavita Nair', 'Aditya Singh',
];

export function CredScanView() {
  const [analysis, setAnalysis] = useState<AIRiskAnalysis | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [resolvedRisks, setResolvedRisks] = useState<Set<string>>(new Set());

  const filteredSuggestions = useMemo(
    () =>
      candidateName.length > 0
        ? CANDIDATES.filter((c) => c.toLowerCase().includes(candidateName.toLowerCase()))
        : CANDIDATES,
    [candidateName]
  );

  const runAnalysis = async (name: string) => {
    setIsAnalyzing(true);
    setHasAnalyzed(true);
    setShowSuggestions(false);

    try {
      // Try real AI-powered analysis first
      const result = await aiRiskApi.analyze(name);
      const analysis: AIRiskAnalysis = {
        candidateName: name,
        overallRiskScore: result.overallRiskScore,
        riskFactors: result.riskFactors.map(f => ({
          category: f.category,
          severity: f.severity as RiskFactor['severity'],
          description: f.description,
          confidence: f.confidence,
        })),
        recommendations: result.recommendations,
        timestamp: new Date().toISOString(),
      };
      setAnalysis(analysis);
    } catch {
      // Fallback to mock data if AI API fails
      const result = generateAIRiskAnalysis(name);
      setAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-run demo analysis on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      runAnalysis('Arjun Mehta');
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) return;
    runAnalysis(candidateName.trim());
  };

  const selectCandidate = (name: string) => {
    setCandidateName(name);
    runAnalysis(name);
  };

  return (
    <div className="space-y-6">
      {/* Header — Premium */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-luxury animate-pulse-glow">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-gradient">CredScan AI</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered risk analysis and resume discrepancy detection
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 text-xs animate-breathing-ai shadow-sm px-3 py-1">
          <Sparkles className="w-3 h-3" />
          AI Engine v2.4
        </Badge>
      </motion.div>

      {/* Candidate Input — Premium Glass */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="gradient-border">
          <Card className="card-premium glass-premium shadow-luxury">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter candidate name to analyze..."
                    value={candidateName}
                    onChange={(e) => {
                      setCandidateName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="pl-9 h-10 bg-background/60 border-border/30 focus:border-primary/50"
                  />
                  <AnimatePresence>
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 right-0 mt-1 glass-premium border border-border/30 rounded-lg shadow-luxury z-50 max-h-48 overflow-y-auto"
                      >
                        {filteredSuggestions.map((name) => (
                          <button
                            key={name}
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 flex items-center gap-2 transition-colors"
                            onClick={() => selectCandidate(name)}
                          >
                            <Fingerprint className="w-3.5 h-3.5 text-muted-foreground" />
                            {name}
                            <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button type="submit" disabled={isAnalyzing || !candidateName.trim()} className="h-10 px-6 btn-premium">
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Analyze
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Loading State — Premium AI Breathing */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="card-premium shadow-luxury border-primary/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative animate-breathing-ai">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Brain className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold tracking-tight">Analyzing {candidateName}...</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Scanning employment records, education history, and court databases
                    </p>
                  </div>
                  <div className="w-full max-w-sm">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/50"
                        initial={{ width: '0%' }}
                        animate={{ width: '65%' }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span>Processing 10 verification sources...</span>
                      <span className="tabular-nums font-semibold">65%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Results — Premium */}
      <AnimatePresence>
        {analysis && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Score + Risk Factors Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Score — Premium with gradient border */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="gradient-border h-full">
                  <Card className="card-premium shadow-luxury h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2 tracking-tight">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Overall Risk Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-4 pb-6">
                      <RiskScoreGauge score={analysis.overallRiskScore} />
                      <div className="mt-4 text-center">
                        <p className="text-sm font-semibold tracking-tight">{analysis.candidateName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          <span className="tabular-nums font-semibold">{analysis.riskFactors.length}</span> risk factor{analysis.riskFactors.length !== 1 ? 's' : ''} detected
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* Risk Factors — Premium */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="lg:col-span-2"
              >
                <Card className="card-premium shadow-luxury h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 tracking-tight">
                      <AlertTriangle className="w-4 h-4 text-primary" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-96">
                      <div className="space-y-3 pr-2">
                        {analysis.riskFactors.map((factor, i) => (
                          <RiskFactorCard
                            key={`${factor.category}-${i}`}
                            factor={factor}
                            index={i}
                            isExpanded={expandedRisk === `${factor.category}-${i}`}
                            onToggle={() => setExpandedRisk(prev => prev === `${factor.category}-${i}` ? null : `${factor.category}-${i}`)}
                            isResolved={resolvedRisks.has(`${factor.category}-${i}`)}
                            onEscalate={() => toast('Risk factor escalated for review')}
                            onResolve={() => {
                              setResolvedRisks(prev => new Set(prev).add(`${factor.category}-${i}`));
                              toast('Risk factor marked as resolved');
                            }}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recommendations — Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="gradient-border">
                <Card className="card-premium shadow-luxury">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 tracking-tight">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.recommendations.map((rec, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/10"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </div>
                          <p className="text-sm leading-relaxed">{rec}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Footer — Premium AI Breathing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground pt-2 pb-4 gap-2"
            >
              <div className="flex items-center gap-1.5 animate-breathing-ai">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="font-medium">Powered by CredScan AI</span>
              </div>
              <span className="tabular-nums">
                Analysis completed{' '}
                {new Date(analysis.timestamp).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State — Premium Glass */}
      {!analysis && !isAnalyzing && !hasAnalyzed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="card-premium glass-premium shadow-luxury border-dashed border-2 border-border/30 hover:border-primary/30 transition-colors">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-4 animate-breathing-ai">
                <Brain className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-sm font-semibold tracking-tight">Enter a candidate name to begin AI analysis</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                CredScan AI will scan employment records, education history, and court databases
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
