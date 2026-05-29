// =====================================================
// VeriShield Pro - ChatVerify Chat API
// Real LLM-powered verification assistant conversations
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
    const { message, conversationHistory } = body as {
      message?: string;
      conversationHistory?: ChatMessage[];
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const zai = await getAI();

    const systemPrompt = `You are ChatVerify, a friendly verification assistant for VeriShield. You help candidates complete their background verification by guiding them through consent, document upload, and liveness checks. Be conversational, clear, and supportive. Keep responses concise (2-3 sentences).

You are communicating via a messaging interface (similar to ChatVerify). The candidate may:
- Ask about the verification process
- Need help with document uploads
- Have questions about consent and data privacy
- Need guidance on liveness checks
- Ask about verification status

Key points to remember:
- Always be respectful of the candidate's privacy and data rights under DPDP Act 2023
- Guide them step-by-step through the verification workflow
- If they seem confused, simplify your explanation
- When they provide consent, acknowledge it clearly
- When they upload documents, confirm receipt and explain next steps
- If they ask about something outside verification, gently redirect
- Use a warm, professional tone appropriate for Indian business context

Respond naturally as if you're having a real conversation. Do not use bullet points or numbered lists unless absolutely necessary.`;

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
      reply: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ChatVerify Chat error:', error);
    return NextResponse.json(
      { error: 'ChatVerify assistant temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
