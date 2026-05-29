import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/auth-middleware';

interface NexusTaskLog {
  timestamp: string;
  message: string;
  level: string;
}

interface NexusTask {
  id: string;
  name: string;
  type: string;
  status: string;
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  logs: NexusTaskLog[];
}

function mapTask(record: {
  id: string;
  name: string;
  type: string;
  status: string;
  progress: number;
  logs: string | null;
  createdAt: Date;
  updatedAt: Date;
}): NexusTask {
  let parsedLogs: NexusTaskLog[] = [];
  if (record.logs) {
    try {
      const decoded = JSON.parse(record.logs);
      if (Array.isArray(decoded)) {
        parsedLogs = decoded;
      }
    } catch {
      parsedLogs = [];
    }
  }

  return {
    id: record.id,
    name: record.name,
    type: record.type,
    status: record.status,
    progress: record.progress,
    createdAt: record.createdAt,
    ...(record.status === 'completed' && { completedAt: record.updatedAt }),
    logs: parsedLogs,
  };
}

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const records = await db.nexusTaskRecord.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const tasks: NexusTask[] = records.map(mapTask);

  return NextResponse.json(tasks);
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

    const record = await db.nexusTaskRecord.create({
      data: {
        name,
        type,
        status: 'pending',
        candidateName: candidateName || name,
        verificationId: verificationId || null,
      },
    });

    const task: NexusTask = mapTask(record);

    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
