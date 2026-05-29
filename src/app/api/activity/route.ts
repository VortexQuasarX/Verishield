// =====================================================
// VeriShield - Activity Logs API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

  const activities = await db.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(activities);
}
