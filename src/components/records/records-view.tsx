'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  Loader2,
  Copy,
  Check,
  MoreHorizontal,
  Eye,
  Download,
  Link2,
  User,
  Calendar,
  StickyNote,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { recordsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import type { VerificationRecord, VerificationStatus, VerificationType, RiskLevel } from '@/types';

// ---- Status Config ----
const STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string; dotColor: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', dotColor: 'bg-amber-500', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', dotColor: 'bg-blue-500', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', dotColor: 'bg-emerald-500', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500', icon: XCircle },
  flagged: { label: 'Flagged', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', dotColor: 'bg-orange-500', icon: Flag },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; dotColor: string }> = {
  low: { label: 'Low', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', dotColor: 'bg-yellow-500' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', dotColor: 'bg-orange-500' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500' },
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  identity: { label: 'Identity', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  employment: { label: 'Employment', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  education: { label: 'Education', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  criminal: { label: 'Criminal', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  credit: { label: 'Credit', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  reference: { label: 'Reference', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  address: { label: 'Address', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  drug: { label: 'Drug Test', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  global_database: { label: 'Global DB', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  address_validation: { label: 'Addr Validation', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400' },
};

// ---- Copy Button ----
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center p-0.5 rounded hover:bg-muted transition-colors"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground" />
      )}
    </button>
  );
}

// ---- Main Records View ----
export function RecordsView() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [sortField, setSortField] = useState('submittedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [accessLevel, setAccessLevel] = useState<'full' | 'limited'>('limited');
  const [newVerDialogOpen, setNewVerDialogOpen] = useState(false);
  const [newVerForm, setNewVerForm] = useState({
    candidateName: '',
    company: '',
    verificationType: 'identity' as VerificationType,
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const { toast } = useToast();

  const fetchRecords = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await recordsApi.getAll({
        page,
        pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        verificationType: typeFilter || undefined,
        riskLevel: riskFilter || undefined,
        sort: sortField,
        sortDir,
      });
      setRecords(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      if ('accessLevel' in response) {
        setAccessLevel((response as Record<string, unknown>).accessLevel as 'full' | 'limited');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, pageSize, search, statusFilter, typeFilter, riskFilter, sortField, sortDir]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = records;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Total from API (already filtered server-side)
  const displayTotal = total;

  const handleCreateVerification = () => {
    if (!newVerForm.candidateName.trim() || !newVerForm.company.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    const now = new Date().toISOString();
    const eta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const newRecord: VerificationRecord = {
      id: `rec_${Date.now()}`,
      verificationId: `MPC-${String(Math.floor(Math.random() * 9000) + 1000).padStart(6, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      candidateName: newVerForm.candidateName.trim(),
      company: newVerForm.company.trim(),
      verificationType: newVerForm.verificationType,
      status: 'pending',
      riskLevel: 'low',
      progress: 0,
      submittedDate: now,
      completionEta: eta,
      createdAt: now,
      updatedAt: now,
    };
    setRecords((prev) => [newRecord, ...prev]);
    setTotal((prev) => prev + 1);
    toast({ title: 'Verification created successfully' });
    setNewVerDialogOpen(false);
    setNewVerForm({ candidateName: '', company: '', verificationType: 'identity', priority: 'medium' });
  };

  const exportToCSV = (record: VerificationRecord) => {
    const headers = ['Verification ID', 'Candidate Name', 'Company', 'Type', 'Status', 'Risk Level', 'Progress', 'Submitted Date', 'Completion ETA', 'Notes', 'Blockchain Hash', 'Created At', 'Updated At'];
    const row = [
      record.verificationId,
      record.candidateName,
      record.company,
      record.verificationType,
      record.status,
      record.riskLevel,
      record.progress ?? '',
      record.submittedDate,
      record.completionEta ?? '',
      record.notes ?? '',
      record.chainHash ?? '',
      record.createdAt,
      record.updatedAt,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verification_${record.verificationId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report exported successfully' });
  };

  const handleFlagRecord = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, riskLevel: 'high' as RiskLevel, status: 'flagged' as VerificationStatus, updatedAt: new Date().toISOString() } : r
      )
    );
    toast({ title: 'Record flagged for review' });
  };

  return (
    <div className="space-y-4">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="text-gradient">Verification Records</span>
            <Badge variant={accessLevel === 'full' ? 'default' : 'outline'} className="text-[10px] bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/20">
              {accessLevel === 'full' ? 'Full Access' : 'Limited'}
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tabular-nums">
            {displayTotal} records &middot; Page {page} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRecords(true)}
            disabled={isRefreshing}
            className="h-9 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="h-9 rounded-lg btn-premium" onClick={() => setNewVerDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Verification
          </Button>
        </div>
      </motion.div>

      {/* ---- Filters ---- */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-xl border-border/50 glass-premium shadow-luxury">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, or ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 rounded-lg"
                />
              </div>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(v) => {
                  setStatusFilter(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] h-9 rounded-lg">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter || 'all'}
                onValueChange={(v) => {
                  setTypeFilter(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] h-9 rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="identity">Identity</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="drug">Drug Test</SelectItem>
                  <SelectItem value="global_database">Global DB</SelectItem>
                  <SelectItem value="address_validation">Addr Validation</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={riskFilter || 'all'}
                onValueChange={(v) => {
                  setRiskFilter(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] h-9 rounded-lg">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              {(statusFilter || typeFilter || riskFilter || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setTypeFilter('');
                    setRiskFilter('');
                    setPage(1);
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- Error State ---- */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="rounded-xl border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={() => fetchRecords(true)} className="ml-auto rounded-lg">
                  Retry
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Table ---- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-xl border-border/50 shadow-luxury overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[40px]" />
                  <TableHead
                    onClick={() => handleSort('verificationId')}
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1 uppercase tracking-wider text-[10px] font-semibold">
                      Verification ID
                      <SortIcon field="verificationId" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort('candidateName')}
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Candidate
                      <SortIcon field="candidateName" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort('company')}
                    className="cursor-pointer select-none hover:text-foreground transition-colors hidden md:table-cell"
                  >
                    <div className="flex items-center gap-1">
                      Company
                      <SortIcon field="company" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead
                    onClick={() => handleSort('status')}
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Risk</TableHead>
                  <TableHead className="hidden xl:table-cell">Progress</TableHead>
                  <TableHead
                    onClick={() => handleSort('submittedDate')}
                    className="cursor-pointer select-none hover:text-foreground transition-colors hidden md:table-cell"
                  >
                    <div className="flex items-center gap-1">
                      Submitted
                      <SortIcon field="submittedDate" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Blockchain</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full max-w-[100px] skeleton-shimmer" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                          <FileSearch className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">No records found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting your search or filters
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 rounded-lg"
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('');
                            setTypeFilter('');
                            setRiskFilter('');
                            setPage(1);
                          }}
                        >
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {filteredRecords.map((record, i) => {
                      const statusCfg = STATUS_CONFIG[record.status];
                      const riskCfg = RISK_CONFIG[record.riskLevel];
                      const typeCfg = TYPE_LABELS[record.verificationType] || { label: record.verificationType, color: 'bg-gray-100 text-gray-700' };
                      const isExpanded = expandedRows.has(record.id);
                      const showProgress = record.status === 'in_progress' && record.progress !== undefined;

                      return (
                        <Collapsible
                          key={record.id}
                          open={isExpanded}
                          onOpenChange={() => toggleRow(record.id)}
                          asChild
                        >
                          <>
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className="border-b border-border/40 hover:bg-gradient-to-r hover:from-primary/[0.03] hover:to-transparent transition-colors cursor-pointer group"
                              onClick={() => toggleRow(record.id)}
                            >
                              <TableCell className="w-[40px]">
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </motion.div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono font-semibold text-primary">
                                    {record.verificationId}
                                  </span>
                                  <CopyButton text={record.verificationId} />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-primary">
                                      {record.candidateName.charAt(0)}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium truncate max-w-[140px]">
                                    {record.candidateName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="text-sm text-muted-foreground truncate max-w-[160px] block">
                                  {record.company}
                                </span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <Badge variant="secondary" className={`text-[10px] font-medium ${typeCfg.color}`}>
                                  {typeCfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor} ${record.status === 'in_progress' ? 'animate-pulse-glow' : ''}`} />
                                  <Badge variant="secondary" className={`text-[10px] font-medium bg-gradient-to-r ${statusCfg.color}`}>
                                    {statusCfg.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${riskCfg.dotColor}`} />
                                  <Badge variant="outline" className={`text-[10px] font-medium ${riskCfg.color}`}>
                                    {riskCfg.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="hidden xl:table-cell">
                                {showProgress ? (
                                  <div className="flex items-center gap-2 min-w-[100px]">
                                    <Progress value={record.progress} className="h-1.5 flex-1" />
                                    <span className="text-[10px] text-muted-foreground w-8 text-right">
                                      {record.progress}%
                                    </span>
                                  </div>
                                ) : record.status === 'completed' ? (
                                  <span className="text-[10px] text-emerald-500 font-medium">100%</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(record.submittedDate)}
                                </span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {record.chainHash ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1 text-primary cursor-pointer">
                                        <Link2 className="w-3 h-3" />
                                        <span className="text-[10px] font-mono truncate max-w-[80px]">
                                          {record.chainHash}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[300px]">
                                      <p className="text-[10px] font-mono break-all">{record.chainHash}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreHorizontal className="w-3.5 h-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => toggleRow(record.id)}>
                                      <Eye className="w-3.5 h-3.5 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportToCSV(record)}>
                                      <Download className="w-3.5 h-3.5 mr-2" />
                                      Export Report
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleFlagRecord(record.id)}>
                                      <Flag className="w-3.5 h-3.5 mr-2" />
                                      Flag Record
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>

                            {/* ---- Expanded Row Details ---- */}
                            <tr>
                              <td colSpan={11} className="p-0 border-0">
                                <CollapsibleContent>
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                  >
                                    <div className="glass-premium px-6 py-4 border-b border-border/40">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Notes */}
                                        <div className="flex items-start gap-2">
                                          <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Notes</p>
                                            <p className="text-xs text-foreground/80 mt-0.5">
                                              {record.notes || 'No notes available for this verification.'}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Completion ETA */}
                                        <div className="flex items-start gap-2">
                                          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Completion ETA</p>
                                            <p className="text-xs text-foreground/80 mt-0.5">
                                              {record.completionEta
                                                ? formatDate(record.completionEta)
                                                : 'Not available'}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Assignee */}
                                        <div className="flex items-start gap-2">
                                          <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Assignee</p>
                                            <p className="text-xs text-foreground/80 mt-0.5">
                                              {record.assigneeId || 'Auto-assigned'}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Blockchain Hash */}
                                        <div className="flex items-start gap-2">
                                          <Link2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Blockchain Hash</p>
                                            {record.chainHash ? (
                                              <div className="flex items-center gap-1.5 mt-0.5">
                                                <p className="text-[10px] font-mono text-primary break-all">
                                                  {record.chainHash}
                                                </p>
                                                <CopyButton text={record.chainHash} />
                                              </div>
                                            ) : (
                                              <p className="text-xs text-muted-foreground mt-0.5">Not sealed yet</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Extra metadata row */}
                                      <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-4 flex-wrap">
                                        <div className="text-[10px] text-muted-foreground">
                                          Created: <span className="text-foreground/70">{formatDateTime(record.createdAt)}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                          Updated: <span className="text-foreground/70">{formatDateTime(record.updatedAt)}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                          ID: <span className="font-mono text-foreground/70">{record.id}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                </CollapsibleContent>
                              </td>
                            </tr>
                          </>
                        </Collapsible>
                      );
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ---- Pagination ---- */}
          {!isLoading && filteredRecords.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs px-3 font-medium tabular-nums btn-premium rounded-md py-0.5">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ---- New Verification Dialog ---- */}
      <Dialog open={newVerDialogOpen} onOpenChange={setNewVerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Verification</DialogTitle>
            <DialogDescription>Create a new background verification request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="candidate-name">Candidate Name *</Label>
              <Input
                id="candidate-name"
                placeholder="Enter candidate name"
                value={newVerForm.candidateName}
                onChange={(e) => setNewVerForm((f) => ({ ...f, candidateName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                placeholder="Enter company name"
                value={newVerForm.company}
                onChange={(e) => setNewVerForm((f) => ({ ...f, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Verification Type</Label>
              <Select
                value={newVerForm.verificationType}
                onValueChange={(v) => setNewVerForm((f) => ({ ...f, verificationType: v as VerificationType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identity">Identity</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="drug">Drug Test</SelectItem>
                  <SelectItem value="global_database">Global DB</SelectItem>
                  <SelectItem value="address_validation">Addr Validation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={newVerForm.priority}
                onValueChange={(v) => setNewVerForm((f) => ({ ...f, priority: v as 'low' | 'medium' | 'high' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewVerDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateVerification}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
