'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Phone,
  Send,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Upload,
  Shield,
  User,
  Bot,
  Paperclip,
  Smile,
  Mic,
  MoreVertical,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Hash,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { generateWhatsAppSessions } from '@/lib/mock-data';
import type {
  WhatsAppSession,
  WhatsAppMessage,
  WhatsAppChatStatus,
  WhatsAppMessageType,
} from '@/types';

// ---- WhatsApp Color Scheme (CSS custom properties for dark mode) ----
const WA_COLORS = {
  header: '#075E54',
  headerDark: '#054D44',
  outgoing: '#DCF8C6',
  outgoingDark: '#005C4B',
  incoming: '#FFFFFF',
  incomingDark: '#1F2C34',
  background: '#ECE5DD',
  backgroundDark: '#0B141A',
  green: '#25D366',
  teal: '#128C7E',
  lightGreen: '#DCF8C6',
};

// ---- Status Config ----
const statusConfig: Record<WhatsAppChatStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  initiated: { label: 'Initiated', color: '#6b7280', bg: 'bg-gray-100 dark:bg-gray-800', icon: Clock },
  consent_given: { label: 'Consent Given', color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: CheckCircle2 },
  documents_uploaded: { label: 'Docs Uploaded', color: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30', icon: Upload },
  verification_in_progress: { label: 'Verifying', color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Shield },
  completed: { label: 'Completed', color: '#22c55e', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2 },
  dropped_off: { label: 'Dropped Off', color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
};

// ---- Message Type Config ----
const msgTypeConfig: Record<WhatsAppMessageType, { accent: string; border: string; icon: React.ElementType }> = {
  otp: { accent: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10', border: '#3b82f6', icon: Hash },
  consent_request: { accent: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10', border: '#f59e0b', icon: Shield },
  document_upload: { accent: 'border-l-violet-500 bg-violet-50/50 dark:bg-violet-900/10', border: '#8b5cf6', icon: FileText },
  status_update: { accent: 'border-l-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10', border: '#06b6d4', icon: CheckCircle2 },
  liveness_link: { accent: 'border-l-teal-500 bg-teal-50/50 dark:bg-teal-900/10', border: '#14b8a6', icon: User },
  completion: { accent: 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10', border: '#22c55e', icon: CheckCircle2 },
  reminder: { accent: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10', border: '#f97316', icon: Clock },
  greeting: { accent: 'border-l-gray-300 dark:border-l-gray-600 bg-gray-50/50 dark:bg-gray-800/30', border: '#9ca3af', icon: MessageCircle },
};

// ---- Relative Time ----
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ---- Format Time ----
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ---- Delivery Status Icon ----
function DeliveryStatus({ status }: { status: WhatsAppMessage['status'] }) {
  switch (status) {
    case 'sent':
      return <Check className="w-3.5 h-3.5 text-gray-400" />;
    case 'delivered':
      return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
    case 'read':
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    case 'failed':
      return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    default:
      return null;
  }
}

// ---- Typing Indicator ----
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2.5">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl rounded-bl-sm bg-white dark:bg-[#1F2C34] shadow-sm">
        <motion.span
          className="w-2 h-2 rounded-full bg-gray-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-gray-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-gray-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
        />
      </div>
    </div>
  );
}

// ---- Quick Action Templates ----
const QUICK_ACTIONS = [
  { label: 'Send OTP', type: 'otp' as WhatsAppMessageType, template: 'Your verification OTP is {OTP}. Valid for 5 minutes. Do not share this with anyone.' },
  { label: 'Request Consent', type: 'consent_request' as WhatsAppMessageType, template: 'Please provide consent for background verification. Reply "AGREE" to proceed. Your data is processed as per DPDP Act 2023.' },
  { label: 'Request Document', type: 'document_upload' as WhatsAppMessageType, template: 'Please upload your document for verification. You can send photos or PDF files directly in this chat.' },
  { label: 'Status Update', type: 'status_update' as WhatsAppMessageType, template: 'Your verification is being processed. We will notify you once each check is completed.' },
  { label: 'Send Reminder', type: 'reminder' as WhatsAppMessageType, template: 'Hi, your verification is still pending. Please complete the required steps at the earliest to avoid delays.' },
];

// ---- Verification Progress Checklist ----
const VERIFICATION_STEPS = [
  { key: 'otp', label: 'OTP Verified' },
  { key: 'consent', label: 'Consent Collected' },
  { key: 'documents', label: 'Documents Uploaded' },
  { key: 'liveness', label: 'Liveness Check' },
  { key: 'verification', label: 'Verification Complete' },
];

// ---- Main Component ----
export function WhatsAppView() {
  // Initialize sessions (lazy useState to avoid effect-based setState)
  const [sessions, setSessions] = useState<WhatsAppSession[]>(() => generateWhatsAppSessions());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(() => null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WhatsAppChatStatus | 'all'>('all');
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.candidateName.toLowerCase().includes(q) ||
          s.candidatePhone.includes(q) ||
          s.verificationId.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    return result;
  }, [sessions, searchQuery, statusFilter]);

  // Auto-select first session if none selected (derived, no effect needed)
  const effectiveSessionId = selectedSessionId ?? (sessions.length > 0 ? sessions[0].id : null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === effectiveSessionId) || null,
    [sessions, effectiveSessionId]
  );

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    if (selectedSession) scrollToBottom();
  }, [selectedSession, scrollToBottom]);

  // Send message
  const sendMessage = useCallback(
    (content: string, type: WhatsAppMessageType = 'greeting') => {
      if (!selectedSessionId || !content.trim()) return;

      const newMsg: WhatsAppMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isFromCandidate: false,
        status: 'sent',
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSessionId
            ? { ...s, messages: [...s.messages, newMsg], lastActivity: newMsg.timestamp }
            : s
        )
      );
      setMessageInput('');
      scrollToBottom();

      // Simulate delivery
      setTimeout(() => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === selectedSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m
                  ),
                }
              : s
          )
        );
      }, 800);

      // Simulate read
      setTimeout(() => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === selectedSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === newMsg.id ? { ...m, status: 'read' as const } : m
                  ),
                }
              : s
          )
        );
      }, 2500);

      // Simulate candidate typing + response for certain types
      if (type === 'otp' || type === 'consent_request') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const response: WhatsAppMessage = {
            id: `msg_${Date.now()}_resp`,
            type: type === 'otp' ? 'otp' : 'consent_request',
            content: type === 'otp' ? '4829' : 'AGREE',
            timestamp: new Date().toISOString(),
            isFromCandidate: true,
            status: 'read',
          };
          setSessions((prev) =>
            prev.map((s) =>
              s.id === selectedSessionId
                ? {
                    ...s,
                    messages: [...s.messages, response],
                    lastActivity: response.timestamp,
                    consentGiven: type === 'consent_request' ? true : s.consentGiven,
                    status: type === 'consent_request' ? 'consent_given' : s.status,
                  }
                : s
            )
          );
          scrollToBottom();
        }, 3000);
      }
    },
    [selectedSessionId, scrollToBottom]
  );

  // Handle quick action
  const handleQuickAction = useCallback(
    (action: (typeof QUICK_ACTIONS)[number]) => {
      const otp = String(Math.floor(1000 + Math.random() * 9000));
      const content = action.template.replace('{OTP}', otp);
      sendMessage(content, action.type);
    },
    [sendMessage]
  );

  // Select session
  const selectSession = useCallback((id: string) => {
    setSelectedSessionId(id);
    setShowMobileChat(true);
  }, []);

  // Analytics
  const analytics = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === 'completed').length;
    const dropped = sessions.filter((s) => s.status === 'dropped_off').length;
    const withDocs = sessions.filter((s) => s.documentsUploaded.length > 0).length;
    const withConsent = sessions.filter((s) => s.consentGiven).length;
    return {
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgTimeToConsent: '2.4h',
      dropOffRate: total > 0 ? Math.round((dropped / total) * 100) : 0,
      documentUploadRate: total > 0 ? Math.round((withDocs / total) * 100) : 0,
      consentRate: total > 0 ? Math.round((withConsent / total) * 100) : 0,
    };
  }, [sessions]);

  // Session detail progress
  const sessionProgress = useMemo(() => {
    if (!selectedSession) return [];
    return VERIFICATION_STEPS.map((step) => {
      let completed = false;
      switch (step.key) {
        case 'otp':
          completed = selectedSession.messages.some(
            (m) => m.type === 'otp' && m.isFromCandidate
          );
          break;
        case 'consent':
          completed = selectedSession.consentGiven;
          break;
        case 'documents':
          completed = selectedSession.documentsUploaded.length > 0;
          break;
        case 'liveness':
          completed = selectedSession.messages.some((m) => m.type === 'liveness_link');
          break;
        case 'verification':
          completed = selectedSession.status === 'completed';
          break;
      }
      return { ...step, completed };
    });
  }, [selectedSession]);

  // Mark for follow-up
  const markForFollowUp = useCallback(
    (sessionId: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, {
                id: `msg_${Date.now()}_followup`,
                type: 'reminder' as WhatsAppMessageType,
                content: '🔄 Marked for follow-up by verification team',
                timestamp: new Date().toISOString(),
                isFromCandidate: false,
                status: 'sent' as const,
              }], lastActivity: new Date().toISOString() }
            : s
        )
      );
    },
    []
  );

  // ---- RENDER ----
  return (
    <div className="space-y-4">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: WA_COLORS.green }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">WhatsApp BGV</h1>
            <p className="text-sm text-muted-foreground">
              Candidate-friendly verification via WhatsApp &mdash; no app install needed
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Sessions', value: analytics.total, color: WA_COLORS.green },
            { label: 'Completed', value: `${analytics.completionRate}%`, color: '#22c55e' },
            { label: 'Drop-off', value: `${analytics.dropOffRate}%`, color: '#ef4444' },
            { label: 'Doc Upload', value: `${analytics.documentUploadRate}%`, color: '#8b5cf6' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-card"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-sm font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Analytics Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { title: 'Total Sessions', value: analytics.total, icon: MessageCircle, color: WA_COLORS.green },
            { title: 'Completion Rate', value: `${analytics.completionRate}%`, icon: CheckCircle2, color: '#22c55e' },
            { title: 'Avg Time to Consent', value: analytics.avgTimeToConsent, icon: Clock, color: '#f59e0b' },
            { title: 'Drop-off Rate', value: `${analytics.dropOffRate}%`, icon: XCircle, color: '#ef4444' },
            { title: 'Document Upload Rate', value: `${analytics.documentUploadRate}%`, icon: Upload, color: '#8b5cf6' },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Card className="border-border/50 hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${card.color}15` }}
                    >
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">{card.title}</span>
                  </div>
                  <p className="text-xl font-bold">{card.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Layout: Session List + Chat + Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 h-[calc(100vh-320px)] min-h-[500px]"
      >
        {/* ---- Left Panel: Session List ---- */}
        <div
          className={`w-full md:w-80 flex-shrink-0 flex flex-col border border-border/50 rounded-xl overflow-hidden bg-card ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search & Filter */}
          <div className="p-3 border-b border-border/50 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {(['all', 'initiated', 'consent_given', 'documents_uploaded', 'verification_in_progress', 'completed', 'dropped_off'] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {status === 'all' ? 'All' : statusConfig[status]?.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Session Items */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/30">
              {filteredSessions.map((session) => {
                const cfg = statusConfig[session.status];
                const isActive = session.id === selectedSessionId;
                const lastMsg = session.messages[session.messages.length - 1];
                const unreadCount = session.messages.filter(
                  (m) => !m.isFromCandidate && m.status === 'delivered'
                ).length;

                return (
                  <button
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`w-full text-left p-3 transition-colors hover:bg-accent/50 relative ${
                      isActive ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback
                          className="text-xs font-semibold"
                          style={{
                            backgroundColor: isActive ? WA_COLORS.green : undefined,
                            color: isActive ? 'white' : undefined,
                          }}
                        >
                          {session.candidateName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold truncate">
                            {session.candidateName}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {relativeTime(session.lastActivity)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {session.candidatePhone}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 h-4 font-semibold"
                            style={{
                              borderColor: cfg.color,
                              color: cfg.color,
                            }}
                          >
                            {cfg.label}
                          </Badge>
                          {session.consentGiven && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          )}
                          {session.documentsUploaded.length > 0 && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <FileText className="w-2.5 h-2.5" />
                              {session.documentsUploaded.length}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <span
                              className="ml-auto flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white"
                              style={{ backgroundColor: WA_COLORS.green }}
                            >
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredSessions.length === 0 && (
                <div className="p-8 text-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No sessions found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ---- Center Panel: Chat View ---- */}
        <div
          className={`flex-1 flex flex-col border border-border/50 rounded-xl overflow-hidden ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
          style={{ backgroundColor: WA_COLORS.background }}
        >
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ backgroundColor: WA_COLORS.header }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white hover:bg-white/10 h-8 w-8"
                  onClick={() => setShowMobileChat(false)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="text-xs font-semibold bg-white/20 text-white">
                    {selectedSession.candidateName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {selectedSession.candidateName}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 h-4 font-semibold border-white/30 text-white/80"
                    >
                      {statusConfig[selectedSession.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Phone className="w-3 h-3" />
                    <span>{selectedSession.candidatePhone}</span>
                    <span className="text-white/30">&bull;</span>
                    <Hash className="w-3 h-3" />
                    <span>{selectedSession.verificationId}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast({ title: `Session: ${selectedSession.candidateName} — ${selectedSession.verificationId}` })}>
                      Session Info
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: 'Chat exported' })}>
                      Export Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: 'Session closed' })}>
                      Close Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-1"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
              >
                {/* Encryption notice */}
                <div className="flex justify-center mb-4">
                  <div className="px-3 py-1.5 rounded-lg bg-yellow-50/80 dark:bg-yellow-900/20 text-[10px] text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Messages are end-to-end encrypted for candidate privacy
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {selectedSession.messages.map((msg, idx) => {
                    const typeCfg = msgTypeConfig[msg.type];
                    const TypeIcon = typeCfg.icon;
                    const isFromCandidate = msg.isFromCandidate;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25 }}
                        className={`flex ${isFromCandidate ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`relative max-w-[75%] px-3 py-2 rounded-xl shadow-sm border-l-[3px] ${
                            isFromCandidate
                              ? 'rounded-tr-sm ' + typeCfg.accent
                              : 'rounded-tl-sm ' + typeCfg.accent
                          }`}
                          style={{
                            backgroundColor: isFromCandidate
                              ? WA_COLORS.outgoing
                              : WA_COLORS.incoming,
                          }}
                        >
                          {/* Type label for system messages */}
                          {!isFromCandidate && msg.type !== 'greeting' && (
                            <div className="flex items-center gap-1 mb-1">
                              <TypeIcon
                                className="w-3 h-3"
                                style={{ color: typeCfg.border }}
                              />
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider"
                                style={{ color: typeCfg.border }}
                              >
                                {msg.type.replace('_', ' ')}
                              </span>
                            </div>
                          )}

                          {/* Message content */}
                          <p className="text-[13px] leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>

                          {/* Timestamp + delivery status */}
                          <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
                            <span className="text-[9px] text-gray-500 dark:text-gray-400">
                              {formatTime(msg.timestamp)}
                            </span>
                            {!isFromCandidate && <DeliveryStatus status={msg.status} />}
                          </div>

                          {/* WhatsApp-style tail */}
                          <div
                            className={`absolute top-0 w-0 h-0 ${
                              isFromCandidate
                                ? 'right-[-6px] border-l-[6px] border-l-[#DCF8C6] dark:border-l-[#005C4B]'
                                : 'left-[-6px] border-r-[6px] border-r-white dark:border-r-[#1F2C34]'
                            } border-t-[8px] border-t-transparent`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Typing indicator */}
                {isTyping && <TypingIndicator />}

                <div ref={chatEndRef} />
              </div>

              {/* Quick Actions Bar */}
              <div className="px-3 py-2 border-t border-border/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] px-2.5 whitespace-nowrap flex-shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input Bar */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-[#1F2C34] border-t border-border/30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={() => toast({ title: 'Emoji picker coming soon' })}
                >
                  <Smile className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedSessionId) {
                      const newMsg: WhatsAppMessage = {
                        id: `msg_${Date.now()}_file`,
                        type: 'document_upload',
                        content: `\ud83d\udcce ${file.name} uploaded`,
                        timestamp: new Date().toISOString(),
                        isFromCandidate: false,
                        status: 'sent',
                      };
                      setSessions((prev) =>
                        prev.map((s) =>
                          s.id === selectedSessionId
                            ? { ...s, messages: [...s.messages, newMsg], lastActivity: newMsg.timestamp }
                            : s
                        )
                      );
                      scrollToBottom();
                      e.target.value = '';
                    }
                  }}
                />
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(messageInput, 'greeting');
                      }
                    }}
                    className="h-9 text-sm rounded-full border-border/50 bg-muted/50 pr-10"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={() => toast({ title: 'Voice recording coming soon' })}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full flex-shrink-0"
                  style={{ backgroundColor: WA_COLORS.teal }}
                  onClick={() => sendMessage(messageInput, 'greeting')}
                  disabled={!messageInput.trim()}
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: WA_COLORS.green, opacity: 0.3 }}
                />
                <p className="text-sm font-medium text-muted-foreground">
                  Select a session to view the chat
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---- Right Panel: Session Details Sidebar ---- */}
        <div className="hidden xl:flex w-72 flex-shrink-0 flex-col gap-3 overflow-y-auto">
          {selectedSession && (
            <>
              {/* Candidate Info Card */}
              <Card className="border-border/50 glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Candidate Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback
                        className="text-sm font-bold"
                        style={{ backgroundColor: WA_COLORS.green, color: 'white' }}
                      >
                        {selectedSession.candidateName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{selectedSession.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{selectedSession.candidatePhone}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {selectedSession.verificationId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className="text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${statusConfig[selectedSession.status].color}15`,
                        color: statusConfig[selectedSession.status].color,
                        borderColor: `${statusConfig[selectedSession.status].color}30`,
                      }}
                    >
                      {statusConfig[selectedSession.status].label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      Created {relativeTime(selectedSession.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Progress */}
              <Card className="border-border/50 glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Verification Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sessionProgress.map((step) => (
                      <div key={step.key} className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            step.completed
                              ? 'bg-emerald-500'
                              : 'border-2 border-muted-foreground/30'
                          }`}
                        >
                          {step.completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span
                          className={`text-xs ${
                            step.completed
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Overall</span>
                      <span className="font-semibold text-foreground">
                        {sessionProgress.filter((s) => s.completed).length}/
                        {sessionProgress.length}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(sessionProgress.filter((s) => s.completed).length / sessionProgress.length) * 100}%`,
                          backgroundColor: WA_COLORS.green,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Received */}
              <Card className="border-border/50 glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSession.documentsUploaded.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedSession.documentsUploaded.map((doc, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-xs font-medium">{doc}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No documents uploaded yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Consent Status */}
              <Card className="border-border/50 glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Consent Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      selectedSession.consentGiven
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-amber-500/10 border border-amber-500/20'
                    }`}
                  >
                    {selectedSession.consentGiven ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="text-xs font-semibold">
                        {selectedSession.consentGiven ? 'Consent Received' : 'Awaiting Consent'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedSession.consentGiven
                          ? 'Candidate agreed to verification'
                          : 'Send consent request to proceed'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-border/50 glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      {
                        label: 'Messages Sent',
                        value: selectedSession.messages.filter((m) => !m.isFromCandidate).length,
                      },
                      {
                        label: 'Candidate Replies',
                        value: selectedSession.messages.filter((m) => m.isFromCandidate).length,
                      },
                      {
                        label: 'Response Rate',
                        value: `${selectedSession.messages.filter((m) => !m.isFromCandidate).length > 0 ? Math.round((selectedSession.messages.filter((m) => m.isFromCandidate).length / selectedSession.messages.filter((m) => !m.isFromCandidate).length) * 100) : 0}%`,
                      },
                      {
                        label: 'Time to Consent',
                        value: selectedSession.consentGiven ? '2.4h' : 'N/A',
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                        <span className="text-xs font-semibold">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {selectedSession.status === 'dropped_off' && (
                <Button
                  variant="outline"
                  className="w-full border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                  onClick={() => markForFollowUp(selectedSession.id)}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Mark for Follow-up
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
