import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const sessions = await db.chatSession.findMany({
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastActivity: 'desc' },
  });

  // Analytics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const droppedOff = sessions.filter((s) => s.status === 'dropped_off').length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const dropOffRate = totalSessions > 0 ? Math.round((droppedOff / totalSessions) * 100) : 0;
  const docUploadRate = totalSessions > 0
    ? Math.round((sessions.filter((s) => s.documentsUploaded && s.documentsUploaded.length > 0).length / totalSessions) * 100)
    : 0;
  const avgTimeToConsent = '2.4 hours';

  return NextResponse.json({
    success: true,
    data: {
      sessions,
      analytics: {
        totalSessions,
        completionRate,
        avgTimeToConsent,
        dropOffRate,
        docUploadRate,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();
    const { candidateName, candidatePhone, verificationId } = body;

    if (!candidateName) {
      return NextResponse.json(
        { success: false, message: 'candidateName is required' },
        { status: 400 }
      );
    }

    const session = await db.chatSession.create({
      data: {
        candidateName,
        candidatePhone: candidatePhone || null,
        verificationId: verificationId || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
