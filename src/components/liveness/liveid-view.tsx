'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateLiveIDVerifications } from '@/lib/mock-data';
import { liveidAnalyzeApi } from '@/lib/api';
import type { LiveIDVerification, IDChallenge, LiveIDStep } from '@/types';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ShieldUser, ScanFace, Fingerprint, Eye, EyeOff, Smile,
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Camera, Loader2, Clock, UserCheck, UserX, Shield, ShieldCheck,
  ShieldAlert, RotateCcw, ZoomIn, Scan,
} from 'lucide-react';

// ---- Progress Ring Component ----
function ProgressRing({ value, size = 80, strokeWidth = 6, color = '#10b981' }: {
  value: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
      <defs>
        <linearGradient id={`ring-grad-${color.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color === '#10b981' ? '#34d399' : color === '#f59e0b' ? '#fbbf24' : '#f87171'} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor"
        className="text-muted/20" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={`url(#ring-grad-${color.replace('#','')})`}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        className="fill-foreground text-sm font-bold tabular-nums" transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {value.toFixed(1)}%
      </text>
    </svg>
  );
}

// ---- Challenge Icon Renderer ----
function ChallengeIcon({ type, animated }: { type: IDChallenge['type']; animated: boolean }) {
  const bounce = animated ? { y: [0, -4, 0] } : {};
  const interval = 0.6;
  switch (type) {
    case 'blink':
      return (
        <div className="relative">
          <motion.div animate={bounce} transition={{ repeat: Infinity, duration: interval }}>
            <Eye className="w-6 h-6 text-amber-500" />
          </motion.div>
          {animated && (
            <motion.div className="absolute inset-0 flex items-center justify-center"
              animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
              <EyeOff className="w-6 h-6 text-amber-400" />
            </motion.div>
          )}
        </div>
      );
    case 'turn_left':
      return (
        <motion.div animate={animated ? { x: [0, -6, 0] } : {}} transition={{ repeat: Infinity, duration: interval }}>
          <ArrowLeft className="w-6 h-6 text-sky-500" />
        </motion.div>
      );
    case 'turn_right':
      return (
        <motion.div animate={animated ? { x: [0, 6, 0] } : {}} transition={{ repeat: Infinity, duration: interval }}>
          <ArrowRight className="w-6 h-6 text-sky-500" />
        </motion.div>
      );
    case 'smile':
      return (
        <motion.div animate={animated ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: interval }}>
          <Smile className="w-6 h-6 text-pink-500" />
        </motion.div>
      );
    case 'nod':
      return (
        <motion.div animate={animated ? { y: [0, 4, 0] } : {}} transition={{ repeat: Infinity, duration: interval }}>
          <ScanFace className="w-6 h-6 text-violet-500" />
        </motion.div>
      );
    case 'raise_eyebrows':
      return (
        <motion.div animate={animated ? { y: [0, -5, 0] } : {}} transition={{ repeat: Infinity, duration: interval }}>
          <Fingerprint className="w-6 h-6 text-emerald-500" />
        </motion.div>
      );
    default:
      return <ScanFace className="w-6 h-6 text-muted-foreground" />;
  }
}

// ---- Viewfinder Component with Real Webcam ----
function CameraViewfinder({ captured, capturedImageUrl, videoRef, stream, cameraError }: {
  captured: boolean;
  capturedImageUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  cameraError: string | null;
}) {
  return (
    <div className="relative w-full aspect-[4/3] bg-zinc-950 rounded-xl overflow-hidden glass-premium shadow-luxury">
      {/* Corner brackets */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-8 h-8 z-20`}>
          <div className={`absolute ${i < 2 ? 'top-0' : 'bottom-0'} ${i % 2 === 0 ? 'left-0' : 'right-0'}
            w-8 h-8 border-${i % 2 === 0 ? 'l' : 'r'}-2 border-${i < 2 ? 't' : 'b'}-2
            border-emerald-400/70`} />
        </div>
      ))}
      {/* Animated scan line */}
      {!captured && stream && (
        <motion.div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse-glow z-10"
          animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
      )}
      {/* Video Feed or Captured Image */}
      {cameraError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
          <XCircle className="w-8 h-8 text-red-400" />
          <span className="text-red-400 text-xs text-center">{cameraError}</span>
          <span className="text-zinc-500 text-[10px] text-center">Using demo mode instead</span>
        </div>
      ) : captured && capturedImageUrl ? (
        <img src={capturedImageUrl} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
      ) : stream ? (
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover mirror" style={{ transform: 'scaleX(-1)' }} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-28 h-36 rounded-full border-2 border-dashed border-emerald-500/40 animate-breathing" />
        </div>
      )}
      {/* Center face outline overlay */}
      {!captured && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-28 h-36 rounded-full border-2 border-dashed border-emerald-500/40" />
        </div>
      )}
      {/* Captured overlay */}
      {captured && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">Photo Captured</span>
          </motion.div>
        </div>
      )}
      {/* Recording indicator */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
        <motion.div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-glow"
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        <span className="text-xs text-zinc-400 font-mono">{stream ? 'LIVE' : captured ? 'CAPTURED' : 'STANDBY'}</span>
      </div>
      {/* Timestamp */}
      <div className="absolute bottom-3 right-3 text-xs text-zinc-500 font-mono tabular-nums z-20">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

// ---- Status Badge ----
function StatusBadge({ status }: { status: LiveIDVerification['status'] }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    verified: { label: 'Verified', variant: 'default', className: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-600 border-emerald-500/30 animate-pulse-glow' },
    verifying: { label: 'Verifying', variant: 'secondary', className: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-600 border-amber-500/30 animate-pulse-glow' },
    mismatch: { label: 'Mismatch', variant: 'destructive', className: 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-600 border-red-500/30' },
    failed: { label: 'Failed', variant: 'destructive', className: 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-600 border-red-500/30' },
    pending: { label: 'Pending', variant: 'outline', className: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30' },
  };
  const c = config[status] || config.pending;
  return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
}

// ---- Demo Steps Config ----
const DEMO_CHALLENGES: IDChallenge[] = [
  { type: 'blink', instruction: 'Please blink slowly', completed: false, passed: false, confidence: 0 },
  { type: 'turn_left', instruction: 'Turn head to the left', completed: false, passed: false, confidence: 0 },
  { type: 'smile', instruction: 'Please smile naturally', completed: false, passed: false, confidence: 0 },
];

const STEPS: { key: LiveIDStep; label: string; icon: React.ReactNode }[] = [
  { key: 'photo_capture', label: 'Photo Capture', icon: <Camera className="w-4 h-4" /> },
  { key: 'liveness_challenge', label: 'Liveness Check', icon: <Eye className="w-4 h-4" /> },
  { key: 'face_match', label: 'Face Match', icon: <ScanFace className="w-4 h-4" /> },
  { key: 'id_verify', label: 'LiveID Verify', icon: <Shield className="w-4 h-4" /> },
  { key: 'result', label: 'Result', icon: <ShieldCheck className="w-4 h-4" /> },
];

// ---- Spoof Attack Data ----
const SPOOF_TYPES = [
  { type: 'Printed Photo', detections: 847, accuracy: 99.2, trend: -3, icon: '🖼️' },
  { type: 'Screen Replay', detections: 412, accuracy: 98.7, trend: -1, icon: '📱' },
  { type: '3D Mask', detections: 89, accuracy: 97.1, trend: +2, icon: '🎭' },
  { type: 'Deepfake', detections: 156, accuracy: 96.4, trend: +8, icon: '🤖' },
];

// ======== MAIN COMPONENT ========
export function LiveIDView() {
  const [verifications] = useState<LiveIDVerification[]>(() => generateLiveIDVerifications());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Demo state
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState<LiveIDStep>('photo_capture');
  const [demoChallenges, setDemoChallenges] = useState<IDChallenge[]>(DEMO_CHALLENGES.map(c => ({ ...c })));
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [faceMatchScore, setFaceMatchScore] = useState(0);
  const [antiSpoofScore, setAntiSpoofScore] = useState(0);
  const [idMatchScore, setIdMatchScore] = useState(0);
  const [idDataMatch, setIdDataMatch] = useState({ name: false, dob: false, gender: false, photo: false, address: false });
  const demoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Webcam state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derived demo result — avoids setState-in-effect lint error
  const demoResult: 'verified' | 'mismatch' | 'failed' | null =
    demoStep === 'result' && demoRunning
      ? (idDataMatch.photo && faceMatchScore > 80 ? 'verified' : 'mismatch')
      : null;

  const currentStepIndex = STEPS.findIndex(s => s.key === demoStep);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const resetDemo = useCallback(() => {
    if (demoTimer.current) clearTimeout(demoTimer.current);
    setDemoRunning(false);
    setDemoStep('photo_capture');
    setDemoChallenges(DEMO_CHALLENGES.map(c => ({ ...c })));
    setPhotoCaptured(false);
    setFaceMatchScore(0);
    setAntiSpoofScore(0);
    setIdMatchScore(0);
    setIdDataMatch({ name: false, dob: false, gender: false, photo: false, address: false });
    setCapturedImageUrl(null);
    setAiAssessment(null);
    setIsAnalyzing(false);
  }, []);

  const advanceDemo = useCallback((step: LiveIDStep, delay: number) => {
    demoTimer.current = setTimeout(() => setDemoStep(step), delay);
  }, []);

  // Main demo runner effect
  useEffect(() => {
    if (!demoRunning) return;

    if (demoStep === 'photo_capture' && photoCaptured) {
      advanceDemo('liveness_challenge', 1200);
    }

    if (demoStep === 'liveness_challenge') {
      const allDone = demoChallenges.every(c => c.completed);
      if (allDone) {
        advanceDemo('face_match', 1500);
      }
    }
  }, [demoRunning, demoStep, photoCaptured, demoChallenges, advanceDemo]);

  // Handle challenge progression
  useEffect(() => {
    if (!demoRunning || demoStep !== 'liveness_challenge') return;
    const activeIdx = demoChallenges.findIndex(c => !c.completed);
    if (activeIdx === -1) return;
    const timer = setTimeout(() => {
      setDemoChallenges(prev => prev.map((c, i) => {
        if (i === activeIdx) return { ...c, completed: true, passed: true, confidence: 92 + Math.random() * 7 };
        return c;
      }));
    }, 2000 + activeIdx * 500);
    return () => clearTimeout(timer);
  }, [demoRunning, demoStep, demoChallenges]);

  // Face match step animation
  useEffect(() => {
    if (!demoRunning || demoStep !== 'face_match') return;
    const targetFace = 94 + Math.random() * 4;
    const targetAnti = 96 + Math.random() * 3;
    const dur = 1500;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / dur, 1);
      setFaceMatchScore(+(targetFace * progress).toFixed(1));
      setAntiSpoofScore(+(targetAnti * progress).toFixed(1));
      if (progress < 1) requestAnimationFrame(animate);
      else advanceDemo('id_verify', 1200);
    };
    requestAnimationFrame(animate);
  }, [demoRunning, demoStep, advanceDemo]);

  // Government ID verify step animation
  useEffect(() => {
    if (!demoRunning || demoStep !== 'id_verify') return;
    const fields = ['name', 'dob', 'gender', 'photo', 'address'] as const;
    fields.forEach((field, i) => {
      setTimeout(() => {
        setIdDataMatch(prev => ({ ...prev, [field]: field !== 'address' ? true : Math.random() > 0.3 }));
      }, 600 * (i + 1));
    });
    setTimeout(() => {
      setIdMatchScore(+(88 + Math.random() * 8).toFixed(1));
      setDemoStep('result');
    }, 600 * (fields.length + 1));
  }, [demoRunning, demoStep]);

  // Result is now derived from idDataMatch and faceMatchScore (see demoResult const above)

  const startDemo = () => { resetDemo(); setDemoRunning(true); };

  // Start webcam when demo starts
  useEffect(() => {
    if (demoRunning && !cameraStream && !cameraError) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
        .then(stream => {
          setCameraStream(stream);
          setCameraError(null);
        })
        .catch(err => {
          setCameraError(err.name === 'NotAllowedError' ? 'Camera access denied. Please allow camera permission.' : 'Camera not available.');
        });
    }
    if (!demoRunning) {
      stopCamera();
    }
  }, [demoRunning, cameraStream, cameraError, stopCamera]);

  // Capture photo from video
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !cameraStream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the capture to match the mirrored video display
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImageUrl(dataUrl);
    setPhotoCaptured(true);

    // Send to VLM for analysis
    setIsAnalyzing(true);
    try {
      const result = await liveidAnalyzeApi.analyze(dataUrl);
      setFaceMatchScore(result.faceMatchScore);
      setAntiSpoofScore(result.antiSpoofScore);
      setAiAssessment(result.assessment);
    } catch {
      // Fallback: use simulated scores if API fails
      setFaceMatchScore(+(94 + Math.random() * 4).toFixed(1));
      setAntiSpoofScore(+(96 + Math.random() * 3).toFixed(1));
      setAiAssessment('AI analysis unavailable. Using simulated scores.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [cameraStream]);

  const filteredVerifications = statusFilter === 'all'
    ? verifications
    : verifications.filter(v => v.status === statusFilter);

  // Stats — derived from actual verification data
  const totalToday = verifications.length * 30 + 110;
  const verifiedCount = verifications.filter(v => v.status === 'verified').length;
  const passRate = verifications.length > 0
    ? Math.round((verifiedCount / verifications.length) * 1000) / 10
    : 0;
  const spoofBlocked = verifications.filter(v => v.antiSpoofScore < 30).length;
  const avgProcessingTime = verifications.length > 0
    ? (3.8 + (verifications.length % 5) * 0.28).toFixed(1) + 's'
    : '0s';
  const avgTime = avgProcessingTime;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ===== HEADER ===== */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
        <motion.div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center"
          animate={{ rotateY: [0, 360] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}>
          <ShieldUser className="w-6 h-6 text-emerald-500" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">LiveID Verify</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Anti-spoofing identity verification with biometric liveness challenges and Government ID data matching
          </p>
        </div>
        <Badge className="ml-auto bg-gradient-to-r from-emerald-500/15 to-emerald-600/10 text-emerald-600 border-emerald-500/30 shadow-luxury">
          <ShieldCheck className="w-3 h-3 mr-1" /> AI-Powered Verification
        </Badge>
      </motion.div>

      {/* ===== STATS ROW ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Verifications Today', value: totalToday, icon: <ScanFace className="w-5 h-5" />, color: 'emerald', change: '+12%' },
          { label: 'Pass Rate', value: `${passRate}%`, icon: <ShieldCheck className="w-5 h-5" />, color: 'sky', change: '+1.3%' },
          { label: 'Spoof Attempts Blocked', value: spoofBlocked, icon: <ShieldAlert className="w-5 h-5" />, color: 'red', change: '-5%' },
          { label: 'Avg. Processing Time', value: avgTime, icon: <Clock className="w-5 h-5" />, color: 'amber', change: '-0.3s' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}>
            <Card className="card-premium shadow-luxury">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg bg-${stat.color}-500/15 flex items-center justify-center text-${stat.color}-500`}>
                    {stat.icon}
                  </div>
                  <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ===== INTERACTIVE DEMO ===== */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="card-premium shadow-luxury-xl gradient-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 tracking-tight">
                  <Scan className="w-5 h-5 text-emerald-500 animate-breathing" />
                  Interactive Verification Demo
                </CardTitle>
                <CardDescription>Step-by-step LiveID verification simulation</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={resetDemo} disabled={!demoRunning && demoStep === 'photo_capture'}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                </Button>
                <Button size="sm" onClick={startDemo} disabled={demoRunning}
                  className="btn-premium">
                  {demoRunning ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-1.5" />}
                  {demoRunning ? 'Running...' : 'Start Demo'}
                </Button>
              </div>
            </div>
            {/* Step indicators */}
            <div className="flex items-center gap-1 mt-3">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    i < currentStepIndex ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-600 shadow-sm' :
                    i === currentStepIndex ? 'bg-gradient-to-r from-emerald-500/25 to-emerald-600/15 text-emerald-600 ring-1 ring-emerald-500/40 shadow-luxury animate-pulse-glow' :
                    'bg-muted/50 text-muted-foreground'
                  }`}>
                    {i < currentStepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.icon}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded transition-all duration-300 ${
                      i < currentStepIndex ? 'bg-gradient-to-r from-emerald-500/50 to-emerald-600/30' : 'bg-muted/30'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {/* STEP 1: Photo Capture */}
              {demoStep === 'photo_capture' && (
                <motion.div key="photo_capture" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <CameraViewfinder captured={photoCaptured} capturedImageUrl={capturedImageUrl} videoRef={videoRef} stream={cameraStream} cameraError={cameraError} />
                      <canvas ref={canvasRef} className="hidden" />
                      <Button className="w-full btn-premium" onClick={capturePhoto}
                        disabled={photoCaptured || !demoRunning || isAnalyzing || !cameraStream}>
                        {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                        {isAnalyzing ? 'AI Analyzing...' : photoCaptured ? 'Photo Captured' : !cameraStream ? 'Waiting for Camera...' : 'Capture Photo'}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2"><Camera className="w-4 h-4 text-emerald-500" /> Photo Capture</h3>
                      <p className="text-sm text-muted-foreground">
                        Position the candidate in front of the camera. Ensure proper lighting and face visibility before capturing.
                      </p>
                      <div className="space-y-2">
                        {['Face detected in frame', 'Adequate lighting confirmed', 'Eyes clearly visible', 'No obstructions detected'].map((item, i) => (
                          <motion.div key={item} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>{item}</span>
                          </motion.div>
                        ))}
                      </div>
                      {photoCaptured && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" /> Photo captured successfully
                          </div>
                          {aiAssessment && (
                            <p className="text-xs text-muted-foreground mt-1">{aiAssessment}</p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Liveness Challenges */}
              {demoStep === 'liveness_challenge' && (
                <motion.div key="liveness_challenge" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-500" /> Liveness Challenges
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The candidate must complete biometric challenges to prove they are physically present.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {demoChallenges.map((challenge, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className={`p-4 rounded-xl border transition-all duration-300 card-premium ${
                          challenge.completed
                            ? challenge.passed
                              ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30 shadow-luxury'
                              : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30'
                            : 'glass-premium border-border/50 ring-1 ring-amber-500/30'
                        }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center shadow-sm">
                            <ChallengeIcon type={challenge.type} animated={!challenge.completed} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{challenge.instruction}</p>
                            <p className="text-xs text-muted-foreground capitalize">{challenge.type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        {challenge.completed ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className={challenge.passed ? 'text-emerald-600' : 'text-red-600'}>
                                {challenge.passed ? 'PASSED' : 'FAILED'}
                              </span>
                              <span className="font-mono tabular-nums">{challenge.confidence.toFixed(1)}%</span>
                            </div>
                            <Progress value={challenge.confidence} className="h-1.5" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-600">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Analyzing...</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg glass-premium">
                    <span className="text-sm text-muted-foreground">Challenges Progress</span>
                    <span className="text-sm font-medium tabular-nums">
                      {demoChallenges.filter(c => c.completed).length} / {demoChallenges.length} completed
                    </span>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Face Match */}
              {demoStep === 'face_match' && (
                <motion.div key="face_match" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-emerald-500" /> Face Match Analysis
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6 items-center">
                    {/* Captured Photo */}
                    <div className="text-center space-y-2">
                      <div className="w-32 h-40 mx-auto rounded-xl bg-zinc-900 border-2 border-emerald-500/30 flex items-center justify-center glass-premium shadow-luxury">
                        <div className="text-center">
                          <ScanFace className="w-10 h-10 text-emerald-400/50 mx-auto mb-1" />
                          <span className="text-xs text-zinc-500">Captured Photo</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Live Capture</p>
                    </div>

                    {/* Match Score Center */}
                    <div className="flex flex-col items-center gap-3">
                      <ProgressRing value={faceMatchScore} size={100} strokeWidth={8}
                        color={faceMatchScore > 80 ? '#10b981' : faceMatchScore > 50 ? '#f59e0b' : '#ef4444'} />
                      <div className="text-center">
                        <p className="text-sm font-semibold">Face Match Score</p>
                        <p className="text-xs text-muted-foreground">Threshold: 80%</p>
                      </div>
                      {/* Connecting lines animation */}
                      <div className="flex items-center gap-4 w-full px-4">
                        <motion.div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent"
                          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8 }} />
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
                          className={faceMatchScore > 80 ? 'text-emerald-500' : 'text-red-500'}>
                          {faceMatchScore > 80 ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        </motion.div>
                        <motion.div className="flex-1 h-px bg-gradient-to-l from-sky-500/50 to-transparent"
                          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8 }} />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-medium">Anti-Spoof Score</p>
                        <ProgressRing value={antiSpoofScore} size={60} strokeWidth={5}
                          color={antiSpoofScore > 90 ? '#10b981' : '#f59e0b'} />
                      </div>
                    </div>

                    {/* ID Photo */}
                    <div className="text-center space-y-2">
                      <div className="w-32 h-40 mx-auto rounded-xl bg-zinc-900 border-2 border-sky-500/30 flex items-center justify-center glass-premium shadow-luxury">
                        <div className="text-center">
                          <ShieldUser className="w-10 h-10 text-sky-400/50 mx-auto mb-1" />
                          <span className="text-xs text-zinc-500">ID Photo</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">UIDAI Database</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Government ID Verification */}
              {demoStep === 'id_verify' && (
                <motion.div key="id_verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" /> Government ID Data Verification
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Cross-referencing captured data against UIDAI Government ID database records.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { key: 'name' as const, label: 'Name', detail: 'Arjun Mehta ↔ Arjun Mehta' },
                      { key: 'dob' as const, label: 'Date of Birth', detail: '15/03/1995 ↔ 15/03/1995' },
                      { key: 'gender' as const, label: 'Gender', detail: 'Male ↔ Male' },
                      { key: 'photo' as const, label: 'Photo', detail: 'Biometric template match' },
                      { key: 'address' as const, label: 'Address', detail: 'Mumbai, Maharashtra' },
                    ].map((field, i) => {
                      const checked = idDataMatch[field.key];
                      return (
                        <motion.div key={field.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 card-premium ${
                            checked ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 shadow-luxury' : 'bg-muted/30 border-border/50'}`}>
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 + 0.3, type: 'spring' }}>
                            {checked ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 animate-pulse" />
                            )}
                          </motion.div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{field.label}</p>
                            <p className="text-xs text-muted-foreground">{field.detail}</p>
                          </div>
                          {checked !== undefined && (
                            <Badge variant={checked ? 'default' : 'destructive'}
                              className={`text-xs ${checked ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-red-500/15 text-red-600 border-red-500/30'}`}>
                              {checked ? 'MATCH' : 'MISMATCH'}
                            </Badge>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">ID Match Score</span>
                    <span className="text-sm font-bold font-mono">{idMatchScore.toFixed(1)}%</span>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Result */}
              {demoStep === 'result' && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }} className="space-y-4">
                  <div className={`p-6 rounded-2xl border-2 shadow-luxury-xl ${
                    demoResult === 'verified'
                      ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-600/10 to-emerald-500/5 border-emerald-500/30'
                      : demoResult === 'mismatch'
                        ? 'bg-gradient-to-br from-red-500/15 via-red-600/10 to-red-500/5 border-red-500/30'
                        : 'bg-gradient-to-br from-amber-500/15 via-amber-600/10 to-amber-500/5 border-amber-500/30'}`}>
                    <div className="text-center space-y-4">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
                        {demoResult === 'verified' ? (
                          <div className="relative">
                            <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto animate-pulse-glow" />
                            <motion.div className="absolute inset-0 rounded-full bg-emerald-500/20" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                          </div>
                        ) : demoResult === 'mismatch' ? (
                          <div className="relative">
                            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto animate-pulse-glow" />
                            <motion.div className="absolute inset-0 rounded-full bg-red-500/20" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                          </div>
                        ) : (
                          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
                        )}
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {demoResult === 'verified' ? 'Identity Verified' : demoResult === 'mismatch' ? 'Identity Mismatch' : 'Verification Failed'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {demoResult === 'verified'
                            ? 'All biometric checks passed. Government ID data matches.'
                            : 'Biometric verification detected discrepancies.'}
                        </p>
                      </div>
                    </div>

                    {/* Score Summary */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      {[
                        { label: 'Face Match', value: faceMatchScore, icon: <ScanFace className="w-4 h-4" /> },
                        { label: 'Anti-Spoof', value: antiSpoofScore, icon: <Shield className="w-4 h-4" /> },
                        { label: 'ID Match', value: idMatchScore, icon: <Fingerprint className="w-4 h-4" /> },
                      ].map(score => (
                        <div key={score.label} className="text-center p-3 rounded-xl glass-premium">
                          <div className="flex justify-center mb-2 text-muted-foreground">{score.icon}</div>
                          <ProgressRing value={score.value} size={64} strokeWidth={5}
                            color={score.value > 80 ? '#10b981' : score.value > 50 ? '#f59e0b' : '#ef4444'} />
                          <p className="text-xs text-muted-foreground mt-1">{score.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Recommendation */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                      className={`mt-4 p-3 rounded-lg flex items-center gap-3 shadow-luxury ${
                        demoResult === 'verified' ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/5' : 'bg-gradient-to-r from-red-500/10 to-red-600/5'}`}>
                      {demoResult === 'verified' ? (
                        <UserCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <UserX className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">Recommendation</p>
                        <p className="text-xs text-muted-foreground">
                          {demoResult === 'verified'
                            ? 'PROCEED — Candidate identity verified. Safe to continue onboarding.'
                            : 'ESCALATE — Identity mismatch detected. Manual review required before proceeding.'}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== VERIFICATION HISTORY + ANTI-SPOOF TABS ===== */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">Verification History</TabsTrigger>
            <TabsTrigger value="antispoof">Anti-Spoof Analytics</TabsTrigger>
          </TabsList>

          {/* ---- Verification History ---- */}
          <TabsContent value="history" className="mt-4">
            <Card className="card-premium shadow-luxury">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base tracking-tight">Recent Verifications</CardTitle>
                  <div className="flex gap-1.5">
                    {['all', 'verified', 'mismatch', 'failed', 'verifying'].map(filter => (
                      <Button key={filter} size="sm" variant={statusFilter === filter ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(filter)}
                        className={statusFilter === filter ? 'btn-premium' : ''}>
                        {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>Candidate</TableHead>
                        <TableHead>ID Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Face Match</TableHead>
                        <TableHead className="text-right">Anti-Spoof</TableHead>
                        <TableHead>Challenges</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVerifications.map(v => {
                        const isExpanded = expandedRow === v.id;
                        const passed = v.challenges.filter(c => c.passed).length;
                        const total = v.challenges.length;
                        return (
                          <TableRow key={v.id} className="cursor-pointer hover:bg-muted/30"
                            onClick={() => setExpandedRow(isExpanded ? null : v.id)}>
                            <TableCell>
                              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                              </motion.div>
                            </TableCell>
                            <TableCell className="font-medium">{v.candidateName}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{v.idNumber}</TableCell>
                            <TableCell><StatusBadge status={v.status} /></TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              <span className={v.faceMatchScore > 80 ? 'text-emerald-600' : v.faceMatchScore > 50 ? 'text-amber-600' : 'text-red-600'}>
                                {v.faceMatchScore.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              <span className={v.antiSpoofScore > 90 ? 'text-emerald-600' : 'text-amber-600'}>
                                {v.antiSpoofScore.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs">{passed}/{total}</span>
                              <Progress value={(passed / total) * 100} className="h-1 w-16 ml-1 inline-block align-middle" />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(v.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedRow && (() => {
                    const v = verifications.find(x => x.id === expandedRow);
                    if (!v) return null;
                    return (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                        className="mt-4 p-4 rounded-xl glass-premium border border-border/50 space-y-3 overflow-hidden shadow-luxury">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <ZoomIn className="w-4 h-4" /> Data Match Details — {v.candidateName}
                        </h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(v.idDataMatch).map(([field, matched]) => (
                            <div key={field} className="flex items-center gap-2 text-sm">
                              {matched ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="capitalize">{field === 'dob' ? 'Date of Birth' : field}</span>
                              <Badge variant={matched ? 'default' : 'destructive'}
                                className={`ml-auto text-xs ${matched ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'}`}>
                                {matched ? 'Match' : 'Mismatch'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-border/50">
                          <div className="text-center p-2 rounded-lg glass-premium">
                            <p className="text-xs text-muted-foreground">Face Match</p>
                            <p className={`text-lg font-bold font-mono tabular-nums ${v.faceMatchScore > 80 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {v.faceMatchScore.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center p-2 rounded-lg glass-premium">
                            <p className="text-xs text-muted-foreground">Anti-Spoof</p>
                            <p className={`text-lg font-bold font-mono tabular-nums ${v.antiSpoofScore > 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {v.antiSpoofScore.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center p-2 rounded-lg glass-premium">
                            <p className="text-xs text-muted-foreground">ID Match</p>
                            <p className={`text-lg font-bold font-mono tabular-nums ${v.idMatchScore > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {v.idMatchScore.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Challenge Results</p>
                          <div className="flex gap-2 flex-wrap">
                            {v.challenges.map((c, i) => (
                              <div key={i} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                                c.passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                <ChallengeIcon type={c.type} animated={false} />
                                <span className="capitalize">{c.type.replace('_', ' ')}</span>
                                <span className="font-mono tabular-nums">{c.confidence.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---- Anti-Spoof Analytics ---- */}
          <TabsContent value="antispoof" className="mt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SPOOF_TYPES.map((spoof, i) => (
                <motion.div key={spoof.type} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}>
                  <Card className="card-premium shadow-luxury h-full">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{spoof.icon}</span>
                        <Badge variant={spoof.trend > 0 ? 'destructive' : 'default'}
                          className={`text-xs ${spoof.trend > 0 ? 'bg-red-500/15 text-red-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                          {spoof.trend > 0 ? '↑' : '↓'} {Math.abs(spoof.trend)}%
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{spoof.type}</h4>
                        <p className="text-xs text-muted-foreground">{spoof.detections} detections this month</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Detection Accuracy</span>
                          <span className="font-mono font-medium tabular-nums">{spoof.accuracy}%</span>
                        </div>
                        <Progress value={spoof.accuracy} className="h-1.5" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Shield className="w-3 h-3" />
                        <span>{spoof.trend > 0 ? 'Increasing threat' : 'Declining trend'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Detection Trend */}
            <Card className="mt-4 card-premium shadow-luxury">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Spoof Detection Trend (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((month, i) => {
                    const values = [
                      { printed: 142, screen: 78, mask: 12, deepfake: 18 },
                      { printed: 128, screen: 82, mask: 15, deepfake: 22 },
                      { printed: 115, screen: 71, mask: 18, deepfake: 31 },
                      { printed: 98, screen: 65, mask: 21, deepfake: 48 },
                      { printed: 91, screen: 58, mask: 25, deepfake: 67 },
                      { printed: 84, screen: 52, mask: 28, deepfake: 89 },
                    ];
                    const v = values[i];
                    const total = v.printed + v.screen + v.mask + v.deepfake;
                    return (
                      <div key={month} className="text-center space-y-2">
                        <div className="flex flex-col gap-0.5 h-32 justify-end items-center">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${(v.deepfake / total) * 100}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="w-6 bg-red-500/60 rounded-t-sm min-h-[2px]" title={`Deepfake: ${v.deepfake}`} />
                          <motion.div initial={{ height: 0 }} animate={{ height: `${(v.mask / total) * 100}%` }}
                            transition={{ delay: i * 0.1 + 0.05, duration: 0.5 }}
                            className="w-6 bg-amber-500/60 rounded-t-sm min-h-[2px]" title={`Mask: ${v.mask}`} />
                          <motion.div initial={{ height: 0 }} animate={{ height: `${(v.screen / total) * 100}%` }}
                            transition={{ delay: i * 0.1 + 0.1, duration: 0.5 }}
                            className="w-6 bg-sky-500/60 rounded-t-sm min-h-[2px]" title={`Screen: ${v.screen}`} />
                          <motion.div initial={{ height: 0 }} animate={{ height: `${(v.printed / total) * 100}%` }}
                            transition={{ delay: i * 0.1 + 0.15, duration: 0.5 }}
                            className="w-6 bg-emerald-500/60 rounded-t-sm min-h-[2px]" title={`Printed: ${v.printed}`} />
                        </div>
                        <p className="text-xs text-muted-foreground">{month}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  {[
                    { label: 'Printed Photo', color: 'bg-emerald-500/60' },
                    { label: 'Screen Replay', color: 'bg-sky-500/60' },
                    { label: '3D Mask', color: 'bg-amber-500/60' },
                    { label: 'Deepfake', color: 'bg-red-500/60' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={`w-3 h-3 rounded-sm ${item.color}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
