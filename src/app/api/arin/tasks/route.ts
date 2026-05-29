import { NextResponse } from 'next/server';
import { generateArinTasks, generateArinWorkflows } from '@/lib/mock-data';

export async function GET() {
  const tasks = generateArinTasks();
  const workflows = generateArinWorkflows();

  // Agent stats
  const activeTasks = tasks.filter((t) => t.status === 'running').length;
  const slaAtRisk = workflows.filter((w) => w.slaStatus === 'at_risk').length;
  const slaOnTrack = workflows.filter((w) => w.slaStatus === 'on_track').length;
  const escalations = tasks.filter(
    (t) => t.type === 'auto_escalation' && new Date(t.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const messagesSent = tasks.filter(
    (t) => t.type === 'candidate_communication' && new Date(t.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return NextResponse.json({
    success: true,
    data: {
      tasks,
      workflows,
      stats: {
        activeTasks,
        slaPredictions: { onTrack: slaOnTrack, atRisk: slaAtRisk },
        autoEscalations: escalations,
        candidateMessages: messagesSent,
      },
      agentStatus: 'active',
    },
  });
}
