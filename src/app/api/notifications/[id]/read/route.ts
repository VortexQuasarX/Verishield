import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/auth-middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const { id } = await params;

  try {
    const notification = await db.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return NextResponse.json(notification);
  } catch {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }
}
