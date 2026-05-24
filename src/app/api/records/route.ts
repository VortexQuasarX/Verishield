// =====================================================
// MPloyChek - Verification Records API
// Paginated, searchable, sortable records with delay support
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateVerificationRecords } from '@/lib/mock-data';

// Generate once and cache
let cachedRecords = generateVerificationRecords(75);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const delay = parseInt(searchParams.get('delay') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';
    const riskFilter = searchParams.get('riskLevel') || '';
    const sortField = searchParams.get('sort') || 'submittedDate';
    const sortDir = searchParams.get('sortDir') || 'desc';

    // Simulate async delay for testing loading states
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    let filtered = [...cachedRecords];

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.candidateName.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.verificationId.toLowerCase().includes(q) ||
        r.verificationType.toLowerCase().includes(q)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Apply risk level filter
    if (riskFilter) {
      filtered = filtered.filter(r => r.riskLevel === riskFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortField] as string;
      const bVal = (b as Record<string, unknown>)[sortField] as string;
      const modifier = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'submittedDate') {
        return modifier * (new Date(aVal).getTime() - new Date(bVal).getTime());
      }
      return modifier * aVal.localeCompare(bVal);
    });

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}
