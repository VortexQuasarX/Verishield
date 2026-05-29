// =====================================================
// VeriShield Pro - AI Dashboard Insights API
// Real LLM-powered contextual insights for the dashboard
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-middleware';
import { getAI, applyDelay } from '@/lib/ai-sdk';

// Simple in-memory cache for insights (5 minute TTL)
let cachedInsights: { data: DashboardInsight[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface DashboardInsight {
  icon: string;
  text: string;
  color: string;
  bg: string;
  accent: string;
}

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    await applyDelay(request);

    const body = await request.json();

    // Return cached insights if available and fresh
    if (cachedInsights && Date.now() - cachedInsights.timestamp < CACHE_TTL) {
      return NextResponse.json({ insights: cachedInsights.data });
    }

    const { stats } = body as {
      stats?: {
        totalVerifications?: number;
        activeVerifications?: number;
        completedToday?: number;
        flaggedRecords?: number;
        averageRiskScore?: number;
        pendingReviews?: number;
        completionRate?: number;
        chainVerifications?: number;
        [key: string]: unknown;
      };
    };

    const zai = await getAI();

    const systemPrompt = `You are an AI analytics engine for VeriShield, an employee background verification platform. You generate actionable dashboard insights based on verification statistics.

You MUST respond with ONLY a valid JSON array (no markdown, no code fences, no extra text) containing 4-6 insight objects. Each insight MUST have this exact format:
{
  "icon": "<lucide-icon-name>",
  "text": "<concise insight text, 1-2 sentences>",
  "color": "<tailwind-text-color-class like text-amber-600 or text-emerald-600>",
  "bg": "<tailwind-bg-class like bg-amber-50 or bg-emerald-50>",
  "accent": "<tailwind-border/accent-class like border-amber-200 or border-emerald-200>"
}

Guidelines for insights:
- Use relevant lucide icon names: AlertTriangle, TrendingUp, TrendingDown, Shield, Clock, CheckCircle, XCircle, Zap, Eye, Activity, BarChart3, Lock, FileWarning, Users, Target, Brain
- Color coding: use green/emerald for positive, amber/yellow for caution, red for critical, blue/teal for informational
- Make insights specific, actionable, and data-driven
- Vary the types: some about risk, some about efficiency, some about trends, some about compliance
- Each insight should feel like a real analyst observation`;

    const userPrompt = `Based on these dashboard statistics, generate 4-6 actionable insights:

${
  stats
    ? `Verification Stats:
- Total Verifications: ${stats.totalVerifications || 'N/A'}
- Active Verifications: ${stats.activeVerifications || 'N/A'}
- Completed Today: ${stats.completedToday || 'N/A'}
- Flagged Records: ${stats.flaggedRecords || 'N/A'}
- Average Risk Score: ${stats.averageRiskScore || 'N/A'}
- Pending Reviews: ${stats.pendingReviews || 'N/A'}
- Completion Rate: ${stats.completionRate || 'N/A'}%
- Chain Verifications: ${stats.chainVerifications || 'N/A'}
${Object.keys(stats)
  .filter((k) => !['totalVerifications', 'activeVerifications', 'completedToday', 'flaggedRecords', 'averageRiskScore', 'pendingReviews', 'completionRate', 'chainVerifications'].includes(k))
  .map((k) => `- ${k}: ${stats[k]}`)
  .join('\n')}`
    : `No specific stats provided. Generate general insights about background verification best practices, common risk patterns, and efficiency recommendations for a typical BGV platform.`
}

Return the JSON array of insights.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    // Parse the LLM response as JSON array
    let insights: DashboardInsight[];
    try {
      let jsonStr = rawResponse.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);

      if (Array.isArray(parsed)) {
        insights = parsed.map((item: Record<string, unknown>) => ({
          icon: String(item.icon || 'Activity'),
          text: String(
            item.text || 'No insight text available'
          ),
          color: String(item.color || 'text-blue-600'),
          bg: String(item.bg || 'bg-blue-50'),
          accent: String(item.accent || 'border-blue-200'),
        }));
      } else {
        throw new Error('Response is not an array');
      }
    } catch {
      // Fallback insights
      insights = getDefaultInsights(stats);
    }

    // Cache the insights
    cachedInsights = { data: insights, timestamp: Date.now() };

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('AI Dashboard Insights error:', error);
    return NextResponse.json(
      {
        error:
          'AI insights engine temporarily unavailable. Please try again.',
      },
      { status: 500 }
    );
  }
}

function getDefaultInsights(
  stats?: Record<string, unknown>
): DashboardInsight[] {
  const flagged = Number(stats?.flaggedRecords) || 0;
  const avgRisk = Number(stats?.averageRiskScore) || 0;
  const pending = Number(stats?.pendingReviews) || 0;
  const completionRate = Number(stats?.completionRate) || 0;

  return [
    {
      icon: avgRisk > 50 ? 'AlertTriangle' : 'Shield',
      text:
        avgRisk > 50
          ? `Average risk score is ${avgRisk}/100 — consider enhancing verification depth for high-risk candidates.`
          : 'Risk levels are within acceptable range. Continue monitoring flagged candidates.',
      color: avgRisk > 50 ? 'text-amber-600' : 'text-emerald-600',
      bg: avgRisk > 50 ? 'bg-amber-50' : 'bg-emerald-50',
      accent: avgRisk > 50 ? 'border-amber-200' : 'border-emerald-200',
    },
    {
      icon: flagged > 5 ? 'FileWarning' : 'CheckCircle',
      text:
        flagged > 5
          ? `${flagged} records flagged for review — prioritize clearing the backlog to maintain SLA compliance.`
          : 'Flagged record volume is manageable. Review each case promptly.',
      color: flagged > 5 ? 'text-red-600' : 'text-emerald-600',
      bg: flagged > 5 ? 'bg-red-50' : 'bg-emerald-50',
      accent: flagged > 5 ? 'border-red-200' : 'border-emerald-200',
    },
    {
      icon: pending > 10 ? 'Clock' : 'Zap',
      text:
        pending > 10
          ? `${pending} verifications pending review — allocate additional resources to prevent SLA breaches.`
          : 'Verification pipeline is flowing efficiently with minimal bottlenecks.',
      color: pending > 10 ? 'text-amber-600' : 'text-teal-600',
      bg: pending > 10 ? 'bg-amber-50' : 'bg-teal-50',
      accent: pending > 10 ? 'border-amber-200' : 'border-teal-200',
    },
    {
      icon: 'TrendingUp',
      text: `Current completion rate is ${completionRate || 78}% — aim for 85%+ by automating routine checks with CredScan AI.`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      accent: 'border-blue-200',
    },
    {
      icon: 'Brain',
      text: 'NexusAI Agent can reduce manual review time by 40% through automated workflow decisions and escalation routing.',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      accent: 'border-violet-200',
    },
  ];
}
