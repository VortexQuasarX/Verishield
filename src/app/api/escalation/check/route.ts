// =====================================================
// VeriShield - Auto-Escalation Check API
// POST endpoint that checks for verifications needing escalation
// Reads escalation settings from DB and escalates old records
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, requireAdmin } from '@/lib/auth-middleware';
import { getSetting } from '@/lib/settings-db';
import { db } from '@/lib/db';
import { fireWebhook } from '@/lib/webhook';

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.valid) return auth.error;

  try {
    // Read escalation settings from DB
    const autoEscalation = await getSetting('auto_escalation');
    const escalationHours = await getSetting('escalation_hours');

    // Check if auto-escalation is enabled
    if (autoEscalation !== 'true') {
      return NextResponse.json({
        escalated: 0,
        message: 'Auto-escalation is disabled',
        autoEscalationEnabled: false,
      });
    }

    const hours = parseInt(escalationHours || '48', 10) || 48;
    const thresholdDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Find records that are pending or in_progress and older than the threshold
    let recordsToEscalate: Array<{
      id: string;
      verificationId: string;
      candidateName: string;
      status: string;
      riskLevel: string;
      submittedDate: Date;
      notes: string | null;
    }> = [];

    try {
      recordsToEscalate = await db.verificationRecord.findMany({
        where: {
          status: { in: ['pending', 'in_progress'] },
          submittedDate: { lt: thresholdDate },
        },
      });
    } catch {
      return NextResponse.json({
        escalated: 0,
        message: 'Could not query verification records',
      });
    }

    // Escalate each record
    let escalatedCount = 0;
    for (const record of recordsToEscalate) {
      try {
        // Update risk level to 'high' if not already
        const existingNotes = record.notes || '';
        const escalationNote = `[${new Date().toISOString()}] AUTO-ESCALATED: Record exceeded ${hours}h threshold (status: ${record.status})`;

        await db.verificationRecord.update({
          where: { id: record.id },
          data: {
            riskLevel: 'high',
            notes: existingNotes
              ? `${existingNotes}\n${escalationNote}`
              : escalationNote,
          },
        });

        // Create a notification for admins
        await db.notification.create({
          data: {
            title: 'Verification Auto-Escalated',
            message: `${record.candidateName} (${record.verificationId}) has been auto-escalated after exceeding the ${hours}h threshold.`,
            type: 'warning',
          },
        });

        // Fire webhook asynchronously (don't block)
        fireWebhook('verification.escalated', {
          verificationId: record.verificationId,
          candidateName: record.candidateName,
          previousStatus: record.status,
          previousRiskLevel: record.riskLevel,
          newRiskLevel: 'high',
          thresholdHours: hours,
          submittedDate: record.submittedDate,
        }).catch(() => {
          // Silently ignore webhook failures
        });

        escalatedCount++;
      } catch {
        // Skip records that fail to update
      }
    }

    return NextResponse.json({
      escalated: escalatedCount,
      message: escalatedCount > 0
        ? `${escalatedCount} verification(s) auto-escalated`
        : 'No verifications required escalation',
      autoEscalationEnabled: true,
      thresholdHours: hours,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to check escalations' },
      { status: 500 }
    );
  }
}
