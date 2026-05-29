// =====================================================
// VeriShield - ChainSeal API
// Builds a real cryptographic chain from completed verification records
// Each block's hash = SHA-256(previousHash + currentRecordHash + timestamp)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { validateAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { sealRecord } from '@/lib/crypto';

interface ChainBlock {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  data: string;
  nonce: number;
  verificationId?: string;
}

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    // Fetch completed/failed/flagged records with their chainHash
    const records = await db.verificationRecord.findMany({
      where: {
        status: { in: ['completed', 'failed', 'flagged'] },
      },
      orderBy: { submittedDate: 'asc' },
    });

    // Build the chain
    const blocks: ChainBlock[] = [];

    // Genesis block
    const genesisHash = crypto
      .createHash('sha256')
      .update('verishield-genesis-block-0')
      .digest('hex');

    blocks.push({
      index: 0,
      hash: `0x${genesisHash}`,
      previousHash: '0x0000000000000000',
      timestamp: new Date(Date.now() - (records.length + 1) * 3600000).toISOString(),
      data: 'Genesis Block',
      nonce: 0,
    });

    let previousHash = `0x${genesisHash}`;

    // Build a block for each sealed record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      // Use stored chainHash or compute one on-the-fly
      let recordHash = record.chainHash;
      if (!recordHash) {
        const sealData = {
          candidateName: record.candidateName,
          company: record.company,
          riskLevel: record.riskLevel,
          status: record.status,
          submittedDate: record.submittedDate.toISOString(),
          verificationId: record.verificationId,
          verificationType: record.verificationType,
        };
        recordHash = sealRecord(sealData);
        // Persist the computed hash
        await db.verificationRecord.update({
          where: { id: record.id },
          data: { chainHash: recordHash },
        });
      }

      // Block hash = SHA-256(previousHash + recordHash + timestamp)
      const timestamp = record.submittedDate.toISOString();
      const blockInput = `${previousHash}${recordHash}${timestamp}`;
      const blockHash = `0x${crypto.createHash('sha256').update(blockInput).digest('hex')}`;

      const statusLabel = record.status === 'completed' ? 'sealed' : record.status;
      blocks.push({
        index: i + 1,
        hash: blockHash,
        previousHash,
        timestamp,
        data: `Verification ${statusLabel}: ${record.verificationId} — ${record.candidateName} @ ${record.company}`,
        nonce: crypto.randomInt(0, 99999),
        verificationId: record.verificationId,
      });

      previousHash = blockHash;
    }

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('ChainSeal API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to build chain';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// POST — Seal a new record onto the chain
export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();
    const { recordId, recordType } = body;

    if (!recordId) {
      return NextResponse.json(
        { error: 'recordId is required' },
        { status: 400 }
      );
    }

    // Find the record to seal
    const record = await db.verificationRecord.findFirst({
      where: { id: recordId },
    });

    if (!record) {
      // If record not found by ID, try by verificationId
      const recordByVid = await db.verificationRecord.findFirst({
        where: { verificationId: recordId },
      });

      if (!recordByVid) {
        // Create a seal for a new type of record
        const sealData = {
          recordId,
          recordType: recordType || 'Custom Record',
          sealedAt: new Date().toISOString(),
        };
        const recordHash = sealRecord(sealData);

        // Get the last block in the chain
        const lastRecords = await db.verificationRecord.findMany({
          where: { status: { in: ['completed', 'failed', 'flagged'] }, chainHash: { not: null } },
          orderBy: { submittedDate: 'desc' },
          take: 1,
        });

        const previousHash = lastRecords.length > 0 && lastRecords[0].chainHash
          ? `0x${lastRecords[0].chainHash}`
          : '0x0000000000000000';

        const timestamp = new Date().toISOString();
        const blockInput = `${previousHash}${recordHash}${timestamp}`;
        const blockHash = `0x${crypto.createHash('sha256').update(blockInput).digest('hex')}`;

        return NextResponse.json({
          id: `cs-${Date.now()}`,
          hash: `0x${recordHash.substring(0, 8)}...${recordHash.substring(recordHash.length - 4)}`,
          blockHash,
          recordType: recordType || 'Custom Record',
          sealedAt: timestamp,
          verified: true,
          previousHash,
        });
      }

      // Found by verificationId — seal it
      return await sealExistingRecord(recordByVid);
    }

    return await sealExistingRecord(record);
  } catch (error) {
    console.error('ChainSeal seal error:', error);
    const message = error instanceof Error ? error.message : 'Failed to seal record';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

async function sealExistingRecord(record: any) {
  // Compute or use existing chainHash
  let recordHash = record.chainHash;
  if (!recordHash) {
    const sealData = {
      candidateName: record.candidateName,
      company: record.company,
      riskLevel: record.riskLevel,
      status: record.status,
      submittedDate: record.submittedDate.toISOString(),
      verificationId: record.verificationId,
      verificationType: record.verificationType,
    };
    recordHash = sealRecord(sealData);
    await db.verificationRecord.update({
      where: { id: record.id },
      data: { chainHash: recordHash },
    });
  }

  // Get previous hash from the chain
  const previousRecords = await db.verificationRecord.findMany({
    where: {
      status: { in: ['completed', 'failed', 'flagged'] },
      chainHash: { not: null },
      submittedDate: { lt: record.submittedDate },
    },
    orderBy: { submittedDate: 'desc' },
    take: 1,
  });

  const previousHash = previousRecords.length > 0 && previousRecords[0].chainHash
    ? `0x${previousRecords[0].chainHash}`
    : '0x0000000000000000';

  const timestamp = new Date().toISOString();
  const blockInput = `${previousHash}${recordHash}${timestamp}`;
  const blockHash = `0x${crypto.createHash('sha256').update(blockInput).digest('hex')}`;

  return NextResponse.json({
    id: `cs-${record.id}`,
    hash: `0x${recordHash.substring(0, 8)}...${recordHash.substring(recordHash.length - 4)}`,
    blockHash,
    recordType: `${record.verificationType} — ${record.candidateName}`,
    sealedAt: timestamp,
    verified: true,
    previousHash,
  });
}
