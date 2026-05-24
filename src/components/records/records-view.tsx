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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { recordsApi } from '@/lib/api';
import type { VerificationRecord, VerificationStatus, RiskLevel } from '@/types';

// ---- Status Config ----
const STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  flagged: { label: 'Flagged', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: Flag },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const TYPE_LABELS: Record<string, string> = {
  identity: 'Identity',
  employment: 'Employment',
  education: 'Education',
  criminal: 'Criminal',
  credit: 'Credit',
  reference: 'Reference',
  address: 'Address',
};

export function RecordsView() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [sortField, setSortField] = useState('submittedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatedDelay, setSimulatedDelay] = useState(0);

  const fetchRecords = useCallback(async (showRetry = false) => {
    if (showRetry) setIsRetrying(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await recordsApi.getAll({
        delay: simulatedDelay,
        page,
        pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        riskLevel: riskFilter || undefined,
        sort: sortField,
        sortDir,
      });
      setRecords(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [page, pageSize, search, statusFilter, riskFilter, sortField, sortDir, simulatedDelay]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verification Records</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} total records • {totalPages} page{totalPages !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Simulate delay:</span>
          <Select value={String(simulatedDelay)} onValueChange={(v) => setSimulatedDelay(Number(v))}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="1000">1s</SelectItem>
              <SelectItem value="2000">2s</SelectItem>
              <SelectItem value="4000">4s</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-40 h-9">
                <Filter className="w-3.5 h-3.5 mr-1.5" />
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
            <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36 h-9">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecords(true)}
              disabled={isRetrying}
              className="h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={() => fetchRecords(true)} className="ml-auto">
                  Retry
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  { key: 'verificationId', label: 'Verification ID' },
                  { key: 'candidateName', label: 'Candidate' },
                  { key: 'company', label: 'Company' },
                  { key: 'verificationType', label: 'Type' },
                  { key: 'status', label: 'Status' },
                  { key: 'riskLevel', label: 'Risk' },
                  { key: 'submittedDate', label: 'Submitted' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <FileSearch className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">No records found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {records.map((record, i) => {
                    const statusCfg = STATUS_CONFIG[record.status];
                    const riskCfg = RISK_CONFIG[record.riskLevel];
                    return (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono font-medium text-primary">{record.verificationId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{record.candidateName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">{record.company}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs">{TYPE_LABELS[record.verificationType] || record.verificationType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={`text-[10px] font-medium ${statusCfg.color}`}>
                            <statusCfg.icon className="w-3 h-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] font-medium ${riskCfg.color}`}>
                            {riskCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{formatDate(record.submittedDate)}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && records.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                <ChevronsRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
