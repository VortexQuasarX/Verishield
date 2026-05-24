// =====================================================
// MPloyChek - Dashboard Trends API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateTrends } from '@/lib/mock-data';

const trends = generateTrends();

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const delay = parseInt(searchParams.get('delay') || '0');

  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return NextResponse.json(trends);
}
