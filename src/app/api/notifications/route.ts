// =====================================================
// VeriShield - Notifications API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const notifications = await db.notification.findMany({
    where: { userId: auth.payload!.sub },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json(notifications);
}
