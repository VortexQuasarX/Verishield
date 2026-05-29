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

  const mapped = sessions.map((s) => ({
    id: s.id,
    candidateName: s.candidateName,
    status: s.status,
    createdAt: s.createdAt,
    lastMessage: s.messages?.[0]?.content || '',
  }));

  return NextResponse.json(mapped);
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

    const mapped = {
      id: session.id,
      candidateName: session.candidateName,
      status: session.status,
      createdAt: session.createdAt,
      lastMessage: '',
    };

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
