// =====================================================
// VeriShield - Webhook Fire API
// POST endpoint that fires webhooks for events
// Reads webhook URL from Setting table and fires HTTP POST
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-middleware';
import { getSetting } from '@/lib/settings-db';

export async function POST(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();
    const { event, data } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Read webhook URL from settings
    let webhookUrl = '';
    try {
      webhookUrl = (await getSetting('webhook_url')) || '';
    } catch {
      // DB not available
    }

    if (!webhookUrl || webhookUrl.trim() === '') {
      return NextResponse.json({
        fired: false,
        url: null,
        reason: 'No webhook URL configured',
      });
    }

    // Build payload
    const payload = {
      event,
      data: data || {},
      timestamp: new Date().toISOString(),
      source: 'verishield',
    };

    // Fire the webhook with 5s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VeriShield-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return NextResponse.json({
        fired: true,
        url: webhookUrl,
        statusCode: response.status,
      });
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      return NextResponse.json({
        fired: false,
        url: webhookUrl,
        error: errorMessage,
        reason: errorMessage.includes('abort') ? 'Webhook request timed out (5s)' : `Webhook delivery failed: ${errorMessage}`,
      });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to process webhook request' },
      { status: 500 }
    );
  }
}
