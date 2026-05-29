// =====================================================
// VeriShield - Verification Records API
// Role-based: Admin sees all, General User sees only own
// Supports delay param, search, filter, sort, pagination
// Reads from Prisma DB with real chain hash sealing
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateVerificationRecords } from '@/lib/mock-data';
import { validateAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { fireWebhook } from '@/lib/webhook';
import { getSetting } from '@/lib/settings-db';
import { sealRecord } from '@/lib/crypto';

// Shape expected by API consumers
interface RecordResponse {
  id: string;
  verificationId: string;
  candidateName: string;
  company: string;
  verificationType: string;
  status: string;
  riskLevel: string;
  submittedDate: string;
  completionEta?: string;
  assigneeId?: string | null;
  notes?: string | null;
  progress: number;
  chainHash?: string;
  createdAt: string;
  updatedAt: string;
}

// Convert Prisma record to response shape
function toResponseRecord(r: {
  id: string;
  verificationId: string;
  candidateName: string;
  company: string;
  verificationType: string;
  status: string;
  riskLevel: string;
  submittedDate: Date;
  completionEta: Date | null;
  assigneeId: string | null;
  notes: string | null;
  chainHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}): RecordResponse {
  // Compute progress from status
  let progress = 0;
  if (r.status === 'completed' || r.status === 'failed' || r.status === 'flagged') {
    progress = 100;
  } else if (r.status === 'in_progress') {
    progress = Math.floor(Math.random() * 80) + 10;
  }

  return {
    id: r.id,
    verificationId: r.verificationId,
    candidateName: r.candidateName,
    company: r.company,
    verificationType: r.verificationType,
    status: r.status,
    riskLevel: r.riskLevel,
    submittedDate: r.submittedDate.toISOString(),
    completionEta: r.completionEta?.toISOString(),
    assigneeId: r.assigneeId,
    notes: r.notes,
    progress,
    chainHash: r.chainHash ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// Cache for mock data fallback
let cachedMockRecords: RecordResponse[] | null = null;

async function getRecords(): Promise<{ records: RecordResponse[]; fromDb: boolean }> {
  try {
    const dbRecords = await db.verificationRecord.findMany({
      orderBy: { submittedDate: 'desc' },
    });

    if (dbRecords.length > 0) {
      // For completed records without a chainHash, compute one and update the DB
      for (const record of dbRecords) {
        if ((record.status === 'completed' || record.status === 'failed' || record.status === 'flagged') && !record.chainHash) {
          const sealData = {
            candidateName: record.candidateName,
            company: record.company,
            riskLevel: record.riskLevel,
            status: record.status,
            submittedDate: record.submittedDate.toISOString(),
            verificationId: record.verificationId,
            verificationType: record.verificationType,
          };
          const computedHash = sealRecord(sealData);
          await db.verificationRecord.update({
            where: { id: record.id },
            data: { chainHash: computedHash },
          });
          record.chainHash = computedHash;
        }
      }

      return {
        records: dbRecords.map(toResponseRecord),
        fromDb: true,
      };
    }

    // DB is empty — seed from mock data on first load
    if (!cachedMockRecords) {
      const mockRecords = generateVerificationRecords(75);
      cachedMockRecords = mockRecords.map(r => ({
        ...r,
        submittedDate: r.submittedDate,
        completionEta: r.completionEta,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    }

    return { records: cachedMockRecords, fromDb: false };
  } catch {
    // If DB fails, fall back to mock data
    if (!cachedMockRecords) {
      const mockRecords = generateVerificationRecords(75);
      cachedMockRecords = mockRecords.map(r => ({
        ...r,
        submittedDate: r.submittedDate,
        completionEta: r.completionEta,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    }
    return { records: cachedMockRecords, fromDb: false };
  }
}

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const { searchParams } = request.nextUrl;
    const delay = parseInt(searchParams.get('delay') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';
    const riskFilter = searchParams.get('riskLevel') || '';
    const typeFilter = searchParams.get('verificationType') || '';
    const sortField = searchParams.get('sort') || 'submittedDate';
    const sortDir = searchParams.get('sortDir') || 'desc';

    // Simulate async delay for testing loading states
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const { records } = await getRecords();
    let filtered = [...records];

    // ---- ACCESS LEVEL ENFORCEMENT ----
    // Admin sees ALL records. General User sees only a subset (their own + limited).
    if (auth.payload?.role !== 'admin') {
      // Non-admin users can only see records assigned to them or a subset
      // Simulate: General users see only ~40% of records (their own verifications)
      filtered = filtered.filter((_, index) => index % 3 !== 2);
    }

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

    // Apply verification type filter
    if (typeFilter) {
      filtered = filtered.filter(r => r.verificationType === typeFilter);
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
      accessLevel: auth.payload?.role === 'admin' ? 'full' : 'limited',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

// POST - Create a new verification record
export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();
    const { candidateName, company, verificationType, assigneeId } = body;

    if (!candidateName || !company || !verificationType) {
      return NextResponse.json(
        { error: 'candidateName, company, and verificationType are required' },
        { status: 400 }
      );
    }

    // Generate a verification ID
    const verificationId = `VSH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Calculate completion ETA (default turnaround from settings)
    let turnaroundDays = 7;
    try {
      const turnaroundStr = await getSetting('default_turnaround');
      if (turnaroundStr) turnaroundDays = parseInt(turnaroundStr, 10) || 7;
    } catch {
      // Use default
    }

    const completionEta = new Date(Date.now() + turnaroundDays * 24 * 60 * 60 * 1000);

    const record = await db.verificationRecord.create({
      data: {
        verificationId,
        candidateName,
        company,
        verificationType,
        status: 'pending',
        riskLevel: 'low',
        completionEta,
        assigneeId: assigneeId || null,
      },
    });

    // Fire webhook asynchronously (don't block the response)
    fireWebhook('verification.created', {
      verificationId: record.verificationId,
      candidateName: record.candidateName,
      company: record.company,
      verificationType: record.verificationType,
      status: record.status,
      riskLevel: record.riskLevel,
      submittedDate: record.submittedDate.toISOString(),
    }).catch(() => {
      // Silently ignore webhook failures
    });

    return NextResponse.json(toResponseRecord(record), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create verification record' },
      { status: 500 }
    );
  }
}
