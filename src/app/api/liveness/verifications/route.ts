import { NextResponse } from 'next/server';
import { generateAadhaarVerifications } from '@/lib/mock-data';

export async function GET() {
  const verifications = generateAadhaarVerifications();

  // Stats
  const totalToday = 142;
  const passed = verifications.filter((v) => v.status === 'verified').length;
  const passRate = Math.round((passed / verifications.length) * 100 * 10) / 10;
  const spoofBlocked = verifications.filter(
    (v) => v.status === 'mismatch' && v.antiSpoofScore < 30
  ).length;
  const avgProcessingTime = '4.2s';

  const spoofTypes = [
    { type: 'Printed Photo', detected: 45, accuracy: 99.2, trend: 'up' },
    { type: 'Screen Replay', detected: 28, accuracy: 97.8, trend: 'stable' },
    { type: '3D Mask', detected: 12, accuracy: 94.5, trend: 'down' },
    { type: 'Deepfake', detected: 8, accuracy: 91.3, trend: 'up' },
  ];

  return NextResponse.json({
    success: true,
    data: {
      verifications,
      stats: {
        verificationsToday: totalToday,
        passRate,
        spoofAttemptsBlocked: spoofBlocked + 23,
        avgProcessingTime,
      },
      spoofAnalytics: spoofTypes,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateName, aadhaarNumber } = body;

    if (!candidateName || !aadhaarNumber) {
      return NextResponse.json(
        { success: false, message: 'candidateName and aadhaarNumber are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: `aadhaar_${Date.now()}`,
        candidateName,
        aadhaarNumber: aadhaarNumber.replace(/(?=\d{4}\d{4})\d/g, 'X'),
        status: 'pending',
        currentStep: 'photo_capture',
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
