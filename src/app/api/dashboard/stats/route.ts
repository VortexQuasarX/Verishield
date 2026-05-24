// =====================================================
// MPloyChek - Dashboard Stats API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const delay = parseInt(searchParams.get('delay') || '0');

  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return NextResponse.json({
    totalVerifications: 2847,
    pendingCases: 156,
    completedChecks: 2453,
    highRiskFlags: 38,
    avgProcessingTime: '3.2 days',
  });
}
