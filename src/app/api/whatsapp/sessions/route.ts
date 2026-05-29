import { NextResponse } from 'next/server';
import { generateWhatsAppSessions } from '@/lib/mock-data';

export async function GET() {
  const sessions = generateWhatsAppSessions();

  // Analytics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const droppedOff = sessions.filter((s) => s.status === 'dropped_off').length;
  const completionRate = Math.round((completedSessions / totalSessions) * 100);
  const dropOffRate = Math.round((droppedOff / totalSessions) * 100);
  const docUploadRate = Math.round(
    (sessions.filter((s) => s.documentsUploaded.length > 0).length / totalSessions) * 100
  );
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, type, content } = body;

    if (!sessionId || !type || !content) {
      return NextResponse.json(
        { success: false, message: 'sessionId, type, and content are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: `msg_${Date.now()}`,
        sessionId,
        type,
        content,
        timestamp: new Date().toISOString(),
        status: 'sent',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
