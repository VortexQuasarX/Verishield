import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const tasks = await db.nexusTaskRecord.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Agent stats
  const activeTasks = tasks.filter((t) => t.status === 'running').length;
  const escalations = tasks.filter(
    (t) => t.type === 'auto_escalation' && new Date(t.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const messagesSent = tasks.filter(
    (t) => t.type === 'candidate_communication' && new Date(t.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return NextResponse.json({
    success: true,
    data: {
      tasks,
      stats: {
        activeTasks,
        slaPredictions: {
          onTrack: tasks.filter((t) => t.status === 'completed').length,
          atRisk: tasks.filter((t) => t.status === 'failed').length,
        },
        autoEscalations: escalations,
        candidateMessages: messagesSent,
      },
      agentStatus: 'active',
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();
    const { name, type, candidateName, verificationId } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, message: 'name and type are required' },
        { status: 400 }
      );
    }

    const task = await db.nexusTaskRecord.create({
      data: {
        name,
        type,
        status: 'pending',
        candidateName: candidateName || name,
        verificationId: verificationId || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
