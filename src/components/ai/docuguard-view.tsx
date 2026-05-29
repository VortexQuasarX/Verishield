'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
  ScanLine,
  Sparkles,
  FileImage,
  FileType,
  Shield,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

// ---- Document Types ----
type DocStatus = 'verified' | 'under_review' | 'flagged';

interface ScannedDocument {
  id: string;
  name: string;
  type: string;
  status: DocStatus;
  confidence: number;
  extractedFields: { label: string; value: string }[];
  issues: string[];
  fileType: 'pdf' | 'jpg' | 'png';
  scanning?: boolean;
}

// ---- Mock Documents ----
const MOCK_DOCS: ScannedDocument[] = [
  {
    id: 'doc_1',
    name: 'Aadhaar Card',
    type: 'Identity Document',
    status: 'verified',
    confidence: 98,
    fileType: 'jpg',
    extractedFields: [
      { label: 'Name', value: 'Arjun Mehta' },
      { label: 'Aadhaar No.', value: 'XXXX-XXXX-4829' },
      { label: 'DOB', value: '15 Mar 1992' },
      { label: 'Gender', value: 'Male' },
      { label: 'Address', value: 'Mumbai, Maharashtra' },
    ],
    issues: [],
  },
  {
    id: 'doc_2',
    name: 'PAN Card',
    type: 'Tax Identity Document',
    status: 'under_review',
    confidence: 82,
    fileType: 'pdf',
    extractedFields: [
      { label: 'Name', value: 'Arjun V. Mehta' },
      { label: 'PAN No.', value: 'ABCPM1234K' },
      { label: 'DOB', value: '15/03/1992' },
      { label: 'Father', value: 'Vijay Mehta' },
    ],
    issues: ['Name variation detected: "Arjun V. Mehta" vs "Arjun Mehta" on Aadhaar'],
  },
  {
    id: 'doc_3',
    name: 'Education Certificate',
    type: 'Academic Document',
    status: 'flagged',
    confidence: 64,
    fileType: 'png',
    extractedFields: [
      { label: 'Name', value: 'Arjun Mehta' },
      { label: 'Degree', value: 'B.Tech Computer Science' },
      { label: 'University', value: 'Mumbai University' },
      { label: 'Year', value: '2014' },
      { label: 'Roll No.', value: 'MU/2014/CS/0847' },
    ],
    issues: [
      'Forgery risk detected — font inconsistency in degree field',
      'University seal does not match verified template',
      'Graduation year conflicts with employment start date',
    ],
  },
];

const statusConfig: Record<DocStatus, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  verified: { color: '#22c55e', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Verified' },
  under_review: { color: '#eab308', bg: 'bg-yellow-500/10', icon: Clock, label: 'Under Review' },
  flagged: { color: '#ef4444', bg: 'bg-red-500/10', icon: AlertTriangle, label: 'Flagged' },
};

// ---- Scan Line Animation ----
function ScanAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-primary/60 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
        initial={{ top: '0%' }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-0 right-0 h-8 bg-primary/5"
        initial={{ top: '-8px' }}
        animate={{ top: ['-8px', 'calc(100% - 8px)', '-8px'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ---- Document Thumbnail ----
function DocThumbnail({ doc }: { doc: ScannedDocument }) {
  const iconMap: Record<string, React.ElementType> = {
    pdf: FileType,
    jpg: FileImage,
    png: FileImage,
  };
  const Icon = iconMap[doc.fileType] || FileText;

  return (
    <div className="relative w-20 h-14 rounded-lg border border-border/50 bg-muted/30 flex items-center justify-center overflow-hidden">
      {doc.scanning && <ScanAnimation />}
      <Icon className="w-6 h-6 text-muted-foreground" />
      <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-muted-foreground uppercase">
        {doc.fileType}
      </span>
    </div>
  );
}

// ---- Document Card ----
function DocumentCard({ doc, index }: { doc: ScannedDocument; index: number }) {
  const [expanded, setExpanded] = useState(doc.status === 'flagged');
  const config = statusConfig[doc.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
    >
      <Card
        className="border-border/50 overflow-hidden"
        style={{ borderLeftWidth: 3, borderLeftColor: config.color }}
      >
        <CardContent className="p-4">
          {/* Header Row */}
          <div className="flex items-center gap-4">
            <DocThumbnail doc={doc} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{doc.name}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold gap-1 px-2"
                  style={{ borderColor: config.color, color: config.color }}
                >
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{doc.type}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-muted-foreground">AI Confidence</span>
                <div className="flex-1 max-w-[100px]">
                  <Progress value={doc.confidence} className="h-1.5" />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: config.color }}>
                  {doc.confidence}%
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-8 w-8 p-0">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-4">
                  {/* Extracted Fields */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Eye className="w-3 h-3" />
                      Extracted Fields
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {doc.extractedFields.map((field) => (
                        <div
                          key={field.label}
                          className="flex items-center justify-between px-3 py-1.5 rounded-md bg-muted/30 text-xs"
                        >
                          <span className="text-muted-foreground">{field.label}</span>
                          <span className="font-medium truncate ml-2">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issues */}
                  {doc.issues.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        Issues Found
                      </p>
                      <div className="space-y-1.5">
                        {doc.issues.map((issue, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 px-3 py-2 rounded-md bg-red-500/5 border border-red-500/10"
                          >
                            <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-600 dark:text-red-400">{issue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No issues */}
                  {doc.issues.length === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">No issues detected</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DocuGuardView() {
  const [documents, setDocuments] = useState<ScannedDocument[]>(MOCK_DOCS);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): 'pdf' | 'jpg' | 'png' => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
    if (ext === 'png') return 'png';
    return 'pdf';
  };

  const handleFiles = (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;

    setIsDragOver(false);
    setIsUploading(true);

    const newDoc: ScannedDocument = {
      id: `doc_${Date.now()}`,
      name: file.name,
      type: 'Scanning...',
      status: 'under_review',
      confidence: 0,
      fileType: getFileType(file),
      scanning: true,
      extractedFields: [],
      issues: [],
    };

    setDocuments((prev) => [...prev, newDoc]);

    // Simulate scan completing after 3 seconds
    setTimeout(() => {
      const isVerified = Math.random() > 0.4;
      const resultStatus: DocStatus = isVerified ? 'verified' : 'flagged';
      const confidence = isVerified ? 85 + Math.floor(Math.random() * 14) : 40 + Math.floor(Math.random() * 30);

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === newDoc.id
            ? {
                ...d,
                type: 'Uploaded Document',
                status: resultStatus,
                confidence,
                scanning: false,
                extractedFields: [
                  { label: 'File Name', value: file.name },
                  { label: 'File Size', value: `${(file.size / 1024).toFixed(1)} KB` },
                  { label: 'Type', value: file.type || 'Unknown' },
                ],
                issues: isVerified
                  ? []
                  : ['Document requires manual review — AI confidence below threshold'],
              }
            : d
        )
      );
      setIsUploading(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">DocuGuard AI</h1>
            <p className="text-sm text-muted-foreground">
              AI document validation and fraud detection
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 text-xs">
          <ScanLine className="w-3 h-3" />
          OCR Engine v3.1
        </Badge>
      </motion.div>

      {/* Upload Area */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Card
          className={`border-2 border-dashed transition-colors duration-200 ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-primary/30'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
        >
          <CardContent className="p-8">
            <div
              className="flex flex-col items-center gap-3 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-medium">Scanning document...</p>
                  <p className="text-xs text-muted-foreground">AI is analyzing the uploaded file</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drop documents here or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepts PDF, JPG, PNG — Max 10MB per file
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-1" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Browse Files
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Document List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Scanned Documents
          </h2>
          <span className="text-xs text-muted-foreground">{documents.length} documents</span>
        </div>
        <div className="space-y-3">
          {documents.map((doc, i) => (
            <DocumentCard key={doc.id} doc={doc} index={i} />
          ))}
        </div>
      </motion.div>

      {/* AI Summary Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Separator className="mb-4" />
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2 pb-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Powered by DocuGuard AI</span>
          </div>
          <span>
            Last scan:{' '}
            {new Date().toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
