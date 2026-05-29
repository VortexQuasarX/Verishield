// =====================================================
// VeriShield Pro - AI Chat API
// Real LLM-powered assistant using z-ai-web-dev-sdk
// Supports conversation history for context
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-middleware';
import { getAI, applyDelay } from '@/lib/ai-sdk';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    await applyDelay(request);

    const body = await request.json();
    const { message, conversationHistory, context } = body as {
      message?: string;
      conversationHistory?: ChatMessage[];
      context?: string;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const zai = await getAI();

    const systemPrompt = `You are NexusAI, an AI assistant for VeriShield, an employee background verification platform. Help users with questions about verification processes, risk analysis, document forensics, and compliance. Be concise and professional.

You are knowledgeable about:
1. Background verification processes (identity, address, education, employment, court records, credit checks, drug tests, global database checks)
2. Platform features: CredScan AI (risk analysis & fraud detection), ForensiDoc AI (document validation & forgery detection), ChatVerify (candidate communication via messaging), ChainSeal (blockchain-secured audit trails), LiveID Verify (identity liveness detection), DeepGuard AI (interview fraud protection), NexusAI Agent (workflow automation)
3. DPDP Act 2023 compliance and data privacy regulations
4. API integration guidance for HRMS/ATS systems
5. Verification status interpretation and recommended next steps
6. Risk scoring methodology and what different risk levels mean

Use professional Indian context where relevant (Government ID, PAN, EPFO, e-Courts). If asked about specific candidate data, remind them to use the dashboard for privacy reasons.

${context ? `Current context: ${context}` : ''}`;

    // Build messages array with conversation history
    const messages: Array<{ role: 'assistant' | 'user'; content: string }> = [
      { role: 'assistant', content: systemPrompt },
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        }
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    const response =
      completion.choices[0]?.message?.content ||
      'I apologize, I could not process your request. Please try again.';

    return NextResponse.json({
      response,
      reply: response, // Backward compatibility with existing chat widget
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'AI assistant temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
