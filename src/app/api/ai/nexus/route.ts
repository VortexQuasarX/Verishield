// =====================================================
// VeriShield Pro - NexusAI Agent API
// Real LLM-powered workflow automation agent
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-middleware';
import { getAI, applyDelay } from '@/lib/ai-sdk';

type NexusAction =
  | 'predict_sla'
  | 'suggest_escalation'
  | 'generate_communication'
  | 'optimize_workflow';

interface SLAPrediction {
  candidateName: string;
  currentSLA: string;
  predictedDelay: string;
  delayRisk: 'low' | 'medium' | 'high';
  bottleneckStep: string;
  recommendedActions: string[];
}

interface EscalationSuggestion {
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  assignTo: string;
  deadline: string;
  additionalNotes: string;
}

interface CommunicationMessage {
  channel: string;
  subject: string;
  message: string;
  tone: string;
}

interface WorkflowOptimization {
  currentBottleneck: string;
  suggestedImprovement: string;
  expectedImpact: string;
  priority: 'low' | 'medium' | 'high';
  implementationEffort: 'low' | 'medium' | 'high';
}

interface NexusResponse {
  action: string;
  result: Record<string, unknown>;
  generatedAt: string;
}

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    await applyDelay(request);

    const body = await request.json();
    const { action, context } = body as {
      action?: string;
      context?: Record<string, unknown>;
    };

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { error: 'Action type is required. Supported actions: predict_sla, suggest_escalation, generate_communication, optimize_workflow' },
        { status: 400 }
      );
    }

    const zai = await getAI();

    const validActions: NexusAction[] = [
      'predict_sla',
      'suggest_escalation',
      'generate_communication',
      'optimize_workflow',
    ];

    if (!validActions.includes(action as NexusAction)) {
      return NextResponse.json(
        {
          error: `Invalid action: ${action}. Supported actions: ${validActions.join(', ')}`,
        },
        { status: 400 }
      );
    }

    let systemPrompt = '';
    let userPrompt = '';
    let result: Record<string, unknown>;

    switch (action as NexusAction) {
      case 'predict_sla': {
        systemPrompt = `You are NexusAI, a workflow automation agent for VeriShield background verification platform. You predict SLA delays based on verification data.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) in this exact format:
{
  "predictions": [
    {
      "candidateName": "<string>",
      "currentSLA": "<current SLA deadline>",
      "predictedDelay": "<predicted delay duration>",
      "delayRisk": "<low|medium|high>",
      "bottleneckStep": "<which verification step is the bottleneck>",
      "recommendedActions": ["<action1>", "<action2>"]
    }
  ],
  "overallAssessment": "<string>"
}

Generate 2-3 realistic SLA predictions based on the provided context. Consider factors like document pending time, third-party response delays, high-risk candidates requiring deeper checks, and seasonal volume surges.`;

        userPrompt = `Predict SLA delays for the following verification context:
${context ? JSON.stringify(context, null, 2) : 'No specific context provided. Generate realistic SLA predictions for a typical BGV pipeline with active verifications.'}`;

        const slaCompletion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          thinking: { type: 'disabled' },
        });

        const slaRaw = slaCompletion.choices[0]?.message?.content || '';
        result = parseJsonResponse<Record<string, unknown>>(slaRaw, {
          predictions: [
            {
              candidateName: 'Pending Candidate',
              currentSLA: '5 business days',
              predictedDelay: '1-2 days',
              delayRisk: 'medium',
              bottleneckStep: 'Employment verification',
              recommendedActions: [
                'Expedite employer contact',
                'Use alternative verification source',
              ],
            },
          ],
          overallAssessment:
            'Moderate delay risk detected in current verification pipeline. Employment verification step is the primary bottleneck.',
        });
        break;
      }

      case 'suggest_escalation': {
        systemPrompt = `You are NexusAI, a workflow automation agent for VeriShield background verification platform. You suggest escalation actions for stuck or high-risk verifications.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) in this exact format:
{
  "escalations": [
    {
      "reason": "<why escalation is needed>",
      "urgency": "<low|medium|high|critical>",
      "recommendedAction": "<what should be done>",
      "assignTo": "<team or role>",
      "deadline": "<when it should be resolved>",
      "additionalNotes": "<any extra context>"
    }
  ],
  "escalationSummary": "<string>"
}

Generate 2-3 realistic escalation suggestions based on the context. Consider stuck verifications, high-risk flags, compliance deadlines, and candidate experience impact.`;

        userPrompt = `Suggest escalation actions for the following context:
${context ? JSON.stringify(context, null, 2) : 'No specific context provided. Generate realistic escalation suggestions for a BGV platform with some flagged and delayed verifications.'}`;

        const escCompletion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          thinking: { type: 'disabled' },
        });

        const escRaw = escCompletion.choices[0]?.message?.content || '';
        result = parseJsonResponse<Record<string, unknown>>(escRaw, {
          escalations: [
            {
              reason: 'Verification pending beyond SLA threshold',
              urgency: 'high',
              recommendedAction:
                'Escalate to senior verification team and notify the hiring manager',
              assignTo: 'Senior Verification Analyst',
              deadline: 'Within 4 hours',
              additionalNotes:
                'Candidate start date is approaching; expedite resolution needed.',
            },
          ],
          escalationSummary:
            'One or more verifications are approaching SLA breach. Immediate attention recommended.',
        });
        break;
      }

      case 'generate_communication': {
        systemPrompt = `You are NexusAI, a workflow automation agent for VeriShield background verification platform. You generate professional candidate communication messages.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) in this exact format:
{
  "messages": [
    {
      "channel": "<email|sms|chat>",
      "subject": "<subject line for email, or brief description>",
      "message": "<full message body>",
      "tone": "<professional|friendly|urgent|reassuring>"
    }
  ],
  "communicationNotes": "<string>"
}

Generate 1-3 professional communication messages based on the context. Messages should be appropriate for the Indian professional context and maintain VeriShield brand voice.`;

        userPrompt = `Generate candidate communication messages for the following context:
${context ? JSON.stringify(context, null, 2) : 'No specific context provided. Generate a standard verification status update message for a candidate whose background check is in progress.'}`;

        const commCompletion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          thinking: { type: 'disabled' },
        });

        const commRaw = commCompletion.choices[0]?.message?.content || '';
        result = parseJsonResponse<Record<string, unknown>>(commRaw, {
          messages: [
            {
              channel: 'email',
              subject: 'VeriShield Background Verification - Status Update',
              message:
                'Dear Candidate,\n\nYour background verification is currently in progress. We are verifying your employment history and educational credentials. If we require any additional documentation, we will reach out to you promptly.\n\nThank you for your patience.\n\nBest regards,\nVeriShield Verification Team',
              tone: 'professional',
            },
          ],
          communicationNotes:
            'Standard progress update communication generated. Customize as needed for specific situations.',
        });
        break;
      }

      case 'optimize_workflow': {
        systemPrompt = `You are NexusAI, a workflow automation agent for VeriShield background verification platform. You recommend workflow optimizations to improve efficiency and reduce turnaround time.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) in this exact format:
{
  "optimizations": [
    {
      "currentBottleneck": "<what is currently slow or inefficient>",
      "suggestedImprovement": "<specific improvement recommendation>",
      "expectedImpact": "<quantified improvement expected>",
      "priority": "<low|medium|high>",
      "implementationEffort": "<low|medium|high>"
    }
  ],
  "workflowSummary": "<string>"
}

Generate 3-5 realistic workflow optimization suggestions based on the context. Focus on automation opportunities, parallel processing, and resource allocation improvements.`;

        userPrompt = `Recommend workflow optimizations for the following context:
${context ? JSON.stringify(context, null, 2) : 'No specific context provided. Generate workflow optimization suggestions for a typical BGV platform processing 50-100 verifications daily.'}`;

        const wfCompletion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          thinking: { type: 'disabled' },
        });

        const wfRaw = wfCompletion.choices[0]?.message?.content || '';
        result = parseJsonResponse<Record<string, unknown>>(wfRaw, {
          optimizations: [
            {
              currentBottleneck:
                'Sequential verification steps causing delays',
              suggestedImprovement:
                'Implement parallel processing for independent checks (identity, education, employment can run simultaneously)',
              expectedImpact:
                '30-40% reduction in overall turnaround time',
              priority: 'high',
              implementationEffort: 'medium',
            },
            {
              currentBottleneck:
                'Manual document review backlog',
              suggestedImprovement:
                'Deploy ForensiDoc AI for automated document authentication with human review only for flagged cases',
              expectedImpact:
                '60% reduction in document review time',
              priority: 'high',
              implementationEffort: 'low',
            },
            {
              currentBottleneck:
                'Slow employer response for verification',
              suggestedImprovement:
                'Use ChatVerify automated follow-ups with escalating urgency and multiple contact channels',
              expectedImpact:
                '25% faster employer response rate',
              priority: 'medium',
              implementationEffort: 'low',
            },
          ],
          workflowSummary:
            'Key optimizations focus on parallelization, AI-assisted document review, and automated communications. Implementing these can reduce average verification time by 35-45%.',
        });
        break;
      }
    }

    const response: NexusResponse = {
      action,
      result,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('NexusAI Agent error:', error);
    return NextResponse.json(
      {
        error:
          'NexusAI Agent temporarily unavailable. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * Parse JSON from LLM response with fallback
 */
function parseJsonResponse<T>(raw: string, fallback: T): T {
  try {
    let jsonStr = raw.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    return JSON.parse(jsonStr) as T;
  } catch {
    return fallback;
  }
}
