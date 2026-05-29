// =====================================================
// VeriShield - Dashboard Trends API
// Computes verification trends from the database
// Groups records by month (last 12 months)
// Supports ?delay=X for async processing simulation
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  const { searchParams } = request.nextUrl;
  const delay = parseInt(searchParams.get('delay') || '0');

  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  try {
    // Build the last 12 months
    const now = new Date();
    const months: { month: string; year: number; monthNum: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleString('en', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
      });
    }

    // Earliest month start for a single bulk query
    const earliestStart = new Date(months[0].year, months[0].monthNum, 1);

    // Fetch all records submitted within the last 12 months
    const records = await db.verificationRecord.findMany({
      where: {
        submittedDate: {
          gte: earliestStart,
        },
      },
      select: {
        submittedDate: true,
        status: true,
        riskLevel: true,
      },
    });

    // Aggregate records per month
    const trends = months.map((m) => {
      const start = new Date(m.year, m.monthNum, 1);
      const end = new Date(m.year, m.monthNum + 1, 1);

      const inMonth = records.filter((r) => {
        const d = r.submittedDate;
        return d >= start && d < end;
      });

      const completed = inMonth.filter((r) => r.status === 'completed').length;
      const pending = inMonth.filter((r) => r.status === 'pending').length;
      const flagged = inMonth.filter(
        (r) => r.status === 'flagged' || r.riskLevel === 'high' || r.riskLevel === 'critical'
      ).length;
      // aiProcessed = completed + in_progress (assumed AI-handled)
      const aiProcessed = inMonth.filter(
        (r) => r.status === 'completed' || r.status === 'in_progress'
      ).length;

      return {
        month: m.month,
        completed,
        pending,
        flagged,
        aiProcessed,
      };
    });

    return NextResponse.json(trends);
  } catch {
    // Fallback: return zeroed-out trends for 12 months
    const fallbackMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const trends = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trends.push({
        month: d.toLocaleString('en', { month: 'short' }),
        completed: 0,
        pending: 0,
        flagged: 0,
        aiProcessed: 0,
      });
    }
    return NextResponse.json(trends);
  }
}
