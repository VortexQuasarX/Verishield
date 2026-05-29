import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/auth-middleware';

function mapToSession(check: {
  id: string;
  candidateName: string;
  status: string;
  createdAt: Date;
  deepfakeScore: number | null;
  confidenceScore: number;
}) {
  return {
    id: check.id,
    name: check.candidateName,
    status: check.status,
    createdAt: check.createdAt.toISOString(),
    ...(check.deepfakeScore != null && { deepfakeScore: check.deepfakeScore }),
    ...(check.confidenceScore > 0 && { confidence: check.confidenceScore }),
  };
}

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const identityChecks = await db.deepGuardCheck.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const sessions = identityChecks.map(mapToSession);

  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();
    const candidateName = body.name ?? body.candidateName;
    const { verificationId } = body;

    if (!candidateName) {
      return NextResponse.json(
        { success: false, message: 'name is required' },
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

    return NextResponse.json(mapToSession(check));
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
