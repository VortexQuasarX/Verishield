import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const records = await db.liveIDRecord.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const verifications = records.map((r) => ({
    id: r.id,
    candidateName: r.candidateName,
    matchScore: r.faceMatchScore || r.idMatchScore,
    livenessScore: r.livenessScore,
    status: r.status,
    createdAt: r.createdAt,
  }));

  return NextResponse.json(verifications);
}

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();
    const { candidateName, idNumber } = body;

    if (!candidateName || !idNumber) {
      return NextResponse.json(
        { success: false, message: 'candidateName and idNumber are required' },
        { status: 400 }
      );
    }

    const record = await db.liveIDRecord.create({
      data: {
        candidateName,
        idNumber: (() => {
          const digits = idNumber.replace(/\D/g, '');
          if (digits.length > 8) {
            return digits.slice(0, 4) + 'XXXX' + digits.slice(-4);
          }
          return idNumber;
        })(),
        status: 'pending',
      },
    });

    const verification = {
      id: record.id,
      candidateName: record.candidateName,
      matchScore: record.faceMatchScore || record.idMatchScore,
      livenessScore: record.livenessScore,
      status: record.status,
      createdAt: record.createdAt,
    };

    return NextResponse.json(verification);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
