// =====================================================
// MPloyChek - Activity Logs API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateActivityLogs } from '@/lib/mock-data';

const logs = generateActivityLogs(40);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const delay = parseInt(searchParams.get('delay') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return NextResponse.json(logs.slice(0, limit));
}
