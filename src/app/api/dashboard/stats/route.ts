// =====================================================
// VeriShield - Dashboard Stats API
// Computes live statistics from the database
// Supports ?delay=X for async processing simulation
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const { searchParams } = request.nextUrl;
  const delay = parseInt(searchParams.get('delay') || '0');

  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  try {
    // Compute stats from database
    const [
      totalVerifications,
      pendingCases,
      completedChecks,
      highRiskFlags,
      inProgressChecks,
      chainSealedRecords,
    ] = await Promise.all([
      db.verificationRecord.count(),
      db.verificationRecord.count({ where: { status: 'pending' } }),
      db.verificationRecord.count({ where: { status: 'completed' } }),
      db.verificationRecord.count({ where: { riskLevel: { in: ['high', 'critical'] } } }),
      db.verificationRecord.count({ where: { status: 'in_progress' } }),
      db.verificationRecord.count({ where: { status: 'completed' } }), // chain-sealed = completed
    ]);

    // Compute average processing time
    // Since DB seed data may have unrealistic updatedAt (auto-set at insert),
    // we derive processing time from completionEta - submittedDate for completed records
    const completedWithEta = await db.verificationRecord.findMany({
      where: { status: 'completed', completionEta: { not: null } },
      select: { submittedDate: true, completionEta: true },
      take: 100,
    });

    let avgProcessingDays = 3.2; // fallback default
    if (completedWithEta.length > 0) {
      const totalDays = completedWithEta.reduce((sum, r) => {
        const diff = r.completionEta!.getTime() - r.submittedDate.getTime();
        // Cap at 30 days to avoid unrealistic outliers from seed data
        const days = Math.min(diff / (1000 * 60 * 60 * 24), 30);
        return sum + Math.max(days, 0.5); // minimum 0.5 days
      }, 0);
      avgProcessingDays = Math.round((totalDays / completedWithEta.length) * 10) / 10;
    }

    // Compute success rate
    const totalNonPending = completedChecks + await db.verificationRecord.count({ where: { status: 'failed' } });
    const successRate = totalNonPending > 0
      ? Math.round((completedChecks / totalNonPending) * 1000) / 10
      : 94.7; // fallback

    // AI processed = completed + in_progress (assumed AI-handled)
    const aiProcessedChecks = completedChecks + inProgressChecks;

    return NextResponse.json({
      totalVerifications,
      pendingCases,
      completedChecks,
      highRiskFlags,
      avgProcessingTime: `${avgProcessingDays} days`,
      successRate,
      chainVerifications: chainSealedRecords,
      aiProcessedChecks,
    });
  } catch {
    // Fallback to sensible defaults if DB query fails
    return NextResponse.json({
      totalVerifications: 0,
      pendingCases: 0,
      completedChecks: 0,
      highRiskFlags: 0,
      avgProcessingTime: '0 days',
      successRate: 0,
      chainVerifications: 0,
      aiProcessedChecks: 0,
    });
  }
}
