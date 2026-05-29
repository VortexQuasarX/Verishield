import { NextResponse } from 'next/server';
import { generateLivenessChecks, generateInterviewSessions } from '@/lib/mock-data';

export async function GET() {
  const livenessChecks = generateLivenessChecks();
  const interviewSessions = generateInterviewSessions();

  // Stats
  const activeInterviews = interviewSessions.filter((s) => s.status === 'live').length;
  const threatsDetected = interviewSessions.reduce((sum, s) => sum + s.alertCount, 0);
  const deepfakeBlocks = interviewSessions.filter(
    (s) => s.deepfakeScore > 50 && s.status === 'flagged'
  ).length;
  const identityMismatches = livenessChecks.filter(
    (l) => l.status === 'suspected_spoof' || l.status === 'failed'
  ).length;

  // Alert timeline
  const alerts = [
    { id: 'alert_1', severity: 'critical', message: 'Deepfake suspected — Ananya Desai interview (87.3% deepfake score)', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'alert_2', severity: 'warning', message: 'Tab switch detected — Sneha Kulkarni (2nd occurrence)', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'alert_3', severity: 'success', message: 'Liveness check passed — Arjun Mehta (97.3% confidence)', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'alert_4', severity: 'error', message: 'Face mismatch — Rahul Verma (38.5% match score)', timestamp: new Date(Date.now() - 8 * 3600000).toISOString() },
    { id: 'alert_5', severity: 'warning', message: 'Multiple faces detected in frame — Ananya Desai', timestamp: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString() },
    { id: 'alert_6', severity: 'success', message: 'Identity verified — Priya Sharma (Aadhaar + PAN matched)', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
  ];

  return NextResponse.json({
    success: true,
    data: {
      livenessChecks,
      interviewSessions,
      stats: { activeInterviews, threatsDetected, deepfakeBlocks, identityMismatches },
      alerts,
      threatLevel: deepfakeBlocks > 0 ? 'ELEVATED' : 'NORMAL',
    },
  });
}
