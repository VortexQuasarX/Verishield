import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const identityChecks = await db.deepGuardCheck.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Stats
  const identityMismatches = identityChecks.filter(
    (l) => l.status === 'suspected_spoof' || l.status === 'failed'
  ).length;
  const fraudBlocks = identityChecks.filter(
    (c) => (c.deepfakeScore ?? 0) > 50 && c.status === 'flagged'
  ).length;

  // Alert timeline
  const alerts = identityChecks
    .filter((c) => c.alerts)
    .slice(0, 6)
    .map((c, i) => ({
      id: `alert_${i + 1}`,
      severity: c.status === 'flagged' ? 'critical' : c.status === 'suspected_spoof' ? 'error' : 'success',
      message: c.alerts!,
      timestamp: c.createdAt.toISOString(),
    }));

  return NextResponse.json({
    success: true,
    data: {
      identityChecks,
      stats: {
        activeInterviews: identityChecks.filter((c) => c.status === 'pending').length,
        threatsDetected: identityChecks.filter((c) => c.status === 'flagged').length,
        fraudBlocks,
        identityMismatches,
      },
      alerts,
      threatLevel: fraudBlocks > 0 ? 'ELEVATED' : 'NORMAL',
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();
    const { candidateName, verificationId } = body;

    if (!candidateName) {
      return NextResponse.json(
        { success: false, message: 'candidateName is required' },
        { status: 400 }
      );
    }

    const check = await db.deepGuardCheck.create({
      data: {
        candidateName,
        verificationId: verificationId || null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      data: check,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
