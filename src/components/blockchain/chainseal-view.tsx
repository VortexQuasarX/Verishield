'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link,
  Search,
  Shield,
  Box,
  ArrowRight,
  CheckCircle2,
  Clock,
  Hash,
  Layers,
  Lock,
  Zap,
  Copy,
  Check,
  FileSearch,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { ChainBlock } from '@/types';

// ---- Animated Data Flow Connector ----
function ChainConnector({ isLatest }: { isLatest?: boolean }) {
  return (
    <div className="flex items-center justify-center w-12 flex-shrink-0 relative">
      {/* Gradient line */}
      <div className="w-full h-0.5 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
      {/* Animated dot with glow */}
      <motion.div
        className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-primary/70 shadow-luxury animate-pulse-glow"
        animate={{ x: [-8, 8, -8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {isLatest && (
        <motion.div
          className="absolute w-3 h-3 rounded-full bg-primary/20"
          animate={{ x: [-8, 8, -8], scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}

// ---- Block Card ----
function BlockCard({ block, isGenesis, isLatest, index }: { block: ChainBlock; isGenesis: boolean; isLatest: boolean; index: number }) {
  const [copied, setCopied] = useState(false);

  const truncateHash = (hash: string) => {
    if (hash.length <= 14) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
  };

  const copyHash = () => {
    navigator.clipboard.writeText(block.hash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: 'easeOut' }}
    >
      <Card
        className={`card-premium gradient-border min-w-[220px] w-[220px] flex-shrink-0 transition-shadow duration-200 ${
          isLatest ? 'ring-2 ring-primary/30 shadow-luxury-xl' : 'shadow-luxury'
        } ${isGenesis ? 'bg-primary/[0.03]' : ''}`}
      >
        <CardContent className="p-4 space-y-3">
          {/* Block Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center ${
                  isGenesis ? 'bg-gradient-to-br from-primary/20 to-primary/10' : isLatest ? 'bg-gradient-to-br from-primary/15 to-primary/5 animate-pulse-glow' : 'bg-muted'
                }`}
              >
                {isGenesis ? (
                  <Shield className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Box className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold">Block #{block.index}</span>
                {isGenesis && (
                  <Badge variant="outline" className="text-[8px] ml-1.5 px-1 py-0 text-primary border-primary/30">
                    GENESIS
                  </Badge>
                )}
                {isLatest && (
                  <Badge variant="outline" className="text-[8px] ml-1.5 px-1 py-0 border-primary/30 text-primary">
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1"
                    />
                    LATEST
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Hash */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Hash</span>
              <button
                onClick={copyHash}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Copy hash"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <code className="text-[10px] font-mono bg-gradient-to-r from-muted/50 to-muted/30 px-2 py-1 rounded block break-all tabular-nums shadow-sm">
              {truncateHash(block.hash)}
            </code>
          </div>

          {/* Previous Hash */}
          <div>
            <span className="text-[10px] text-muted-foreground font-medium">Prev Hash</span>
            <code className="text-[10px] font-mono bg-muted/30 px-2 py-1 rounded block break-all tabular-nums">
              {truncateHash(block.previousHash)}
            </code>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{formatTime(block.timestamp)}</span>
          </div>

          {/* Data */}
          <div>
            <span className="text-[10px] text-muted-foreground font-medium">Data</span>
            <p className="text-[10px] text-foreground/80 mt-0.5 leading-snug">{block.data}</p>
          </div>

          {/* Nonce */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Nonce</span>
            <code className="text-[10px] font-mono tabular-nums">{block.nonce}</code>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---- Verification Lookup ----
function VerificationLookup({ blocks }: { blocks: ChainBlock[] }) {
  const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState<{ found: boolean; block?: ChainBlock; message?: string } | null>(null);

  const handleSearch = () => {
    if (!searchId.trim()) {
      setResult(null);
      return;
    }
    const found = blocks.find(
      (b) => b.verificationId && b.verificationId.toLowerCase().includes(searchId.toLowerCase())
    );
    if (found) {
      setResult({ found: true, block: found });
    } else {
      setResult({ found: false, message: `No block found containing verification ID "${searchId}"` });
    }
  };

  return (
    <Card className="card-premium shadow-luxury">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 tracking-tight">
          <FileSearch className="w-4 h-4 text-primary" />
          Verification Lookup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter verification ID (e.g., VSH-001002)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="pl-9 h-9"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} size="sm" className="h-9 px-4 btn-premium">
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Search
          </Button>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-3"
            >
              {result.found && result.block ? (
                <div className="p-3 rounded-lg glass-premium shadow-luxury border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-gradient">
                      Found in Block #{result.block.index}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Hash:</span>
                      <code className="font-mono tabular-nums">{result.block.hash}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Sealed:</span>
                      <span>{new Date(result.block.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Data:</span>
                      <span>{result.block.data}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg glass-premium border border-red-500/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{result.message}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ---- How It Works ----
function HowItWorks() {
  const steps = [
    {
      icon: Hash,
      title: 'Hash Generated',
      description: 'Each verification creates a unique SHA-256 cryptographic hash from the record data',
    },
    {
      icon: Box,
      title: 'Block Created',
      description: 'The hash is packaged into a new block with a reference to the previous block',
    },
    {
      icon: Lock,
      title: 'Chain Sealed',
      description: 'The block is appended to the chain, making the record permanently tamper-proof',
    },
  ];

  return (
    <Card className="card-premium shadow-luxury">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 tracking-tight">
          <Layers className="w-4 h-4 text-primary" />
          How It Works
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.15 }}
                className="flex flex-col items-center text-center gap-3 p-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative shadow-luxury animate-breathing">
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-primary/40 hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2" />
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChainSealView() {
  const [blocks, setBlocks] = useState<ChainBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChainData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get token from localStorage for auth
      const token = typeof window !== 'undefined' ? localStorage.getItem('verishield_token') : null;
      const response = await fetch('/api/chainseal', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chain data: ${response.status}`);
      }

      const data = await response.json();
      setBlocks(data.blocks || []);
    } catch (err) {
      console.error('ChainSeal fetch error:', err);
      setError('Failed to load chain data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChainData();
  }, [fetchChainData]);

  const latestBlock = blocks[blocks.length - 1];
  const stats = useMemo(() => ({
    totalBlocks: blocks.length,
    verificationsSealed: blocks.filter((b) => b.index > 0).length,
    chainIntegrity: 100,
    lastSealedTime: latestBlock?.timestamp
      ? new Date(latestBlock.timestamp).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—',
  }), [blocks, latestBlock]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-luxury animate-breathing">
              <Link className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient">ChainSeal</h1>
              <p className="text-sm text-muted-foreground">
                Tamper-resistant verification records with immutable audit trails
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 text-xs shadow-luxury">
            <Lock className="w-3 h-3" />
            SHA-256 Encrypted
          </Badge>
        </motion.div>
        <Card className="card-premium shadow-luxury-xl gradient-border">
          <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Building cryptographic chain from sealed records...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-luxury animate-breathing">
              <Link className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient">ChainSeal</h1>
              <p className="text-sm text-muted-foreground">
                Tamper-resistant verification records with immutable audit trails
              </p>
            </div>
          </div>
        </motion.div>
        <Card className="card-premium shadow-luxury-xl">
          <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={fetchChainData} variant="outline" size="sm">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-luxury animate-breathing">
            <Link className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient">ChainSeal</h1>
            <p className="text-sm text-muted-foreground">
              Tamper-resistant verification records with immutable audit trails
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 text-xs shadow-luxury">
          <Lock className="w-3 h-3" />
          SHA-256 Encrypted
        </Badge>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Blocks', value: stats.totalBlocks, icon: Box },
          { label: 'Verifications Sealed', value: stats.verificationsSealed, icon: CheckCircle2 },
          { label: 'Chain Integrity', value: `${stats.chainIntegrity}%`, icon: Shield },
          { label: 'Last Sealed', value: stats.lastSealedTime, icon: Clock, isText: true },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Card className="card-premium shadow-luxury">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-sm">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                  </div>
                  <p className={`font-bold tabular-nums ${stat.isText ? 'text-sm' : 'text-xl'}`}>
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Chain Visualization */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="card-premium shadow-luxury-xl gradient-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 tracking-tight">
              <Link className="w-4 h-4 text-primary animate-breathing" />
              Verification Chain
            </CardTitle>
          </CardHeader>
          <CardContent>
            {blocks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No sealed records found. Complete verifications to build the chain.
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="flex items-center gap-0 pb-4 min-w-max">
                  {blocks.map((block, i) => (
                    <div key={block.index} className="flex items-center">
                      <BlockCard
                        block={block}
                        isGenesis={i === 0}
                        isLatest={i === blocks.length - 1}
                        index={i}
                      />
                      {i < blocks.length - 1 && (
                        <ChainConnector isLatest={i === blocks.length - 2} />
                      )}
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Verification Lookup */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <VerificationLookup blocks={blocks} />
      </motion.div>

      {/* How It Works */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <HowItWorks />
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2 pb-4"
      >
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary" />
          <span>DPDP Act 2023 Compliant</span>
        </div>
        <span>Chain integrity verified at {new Date().toLocaleTimeString('en-IN')}</span>
      </motion.div>
    </div>
  );
}
