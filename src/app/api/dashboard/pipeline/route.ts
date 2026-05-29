// =====================================================
// VeriShield - Dashboard Pipeline API
// Computes pipeline stages from the database
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
    // Compute pipeline counts from the database
    const [
      totalRecords,
      nonPending,
      inProgress,
      flaggedAndInProgress,
      completed,
    ] = await Promise.all([
      // Submitted: all records
      db.verificationRecord.count(),
      // Consent Given: all non-pending (they've moved past initial submission)
      db.verificationRecord.count({
        where: { status: { not: 'pending' } },
      }),
      // In Verification: in_progress
      db.verificationRecord.count({
        where: { status: 'in_progress' },
      }),
      // QC Review: flagged records still under review
      db.verificationRecord.count({
        where: {
          status: { in: ['flagged', 'in_progress'] },
          riskLevel: { in: ['high', 'critical'] },
        },
      }),
      // Completed
      db.verificationRecord.count({
        where: { status: 'completed' },
      }),
    ]);

    const maxCount = totalRecords || 1; // avoid division by zero

    const pipeline = [
      {
        name: 'Submitted',
        count: totalRecords,
        percentage: 100,
        color: '#6366f1',
      },
      {
        name: 'Consent Given',
        count: nonPending,
        percentage: Math.round((nonPending / maxCount) * 100),
        color: '#8b5cf6',
      },
      {
        name: 'In Verification',
        count: inProgress,
        percentage: Math.round((inProgress / maxCount) * 100),
        color: '#f59e0b',
      },
      {
        name: 'QC Review',
        count: flaggedAndInProgress,
        percentage: Math.round((flaggedAndInProgress / maxCount) * 100),
        color: '#ec4899',
      },
      {
        name: 'Completed',
        count: completed,
        percentage: Math.round((completed / maxCount) * 100),
        color: '#10b981',
      },
    ];

    return NextResponse.json(pipeline);
  } catch {
    // Fallback: return zeroed-out pipeline
    return NextResponse.json([
      { name: 'Submitted', count: 0, percentage: 0, color: '#6366f1' },
      { name: 'Consent Given', count: 0, percentage: 0, color: '#8b5cf6' },
      { name: 'In Verification', count: 0, percentage: 0, color: '#f59e0b' },
      { name: 'QC Review', count: 0, percentage: 0, color: '#ec4899' },
      { name: 'Completed', count: 0, percentage: 0, color: '#10b981' },
    ]);
  }
}
