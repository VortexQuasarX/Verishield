// =====================================================
// MPloyChek - Notifications API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateNotifications } from '@/lib/mock-data';

const notifications = generateNotifications();

export async function GET() {
  return NextResponse.json(notifications);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notif.isRead = true;
  }
  return NextResponse.json({ success: true });
}
