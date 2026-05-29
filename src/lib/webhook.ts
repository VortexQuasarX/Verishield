// =====================================================
// VeriShield - Webhook Helper
// Fires actual HTTP POSTs to configured webhook URLs
// Reads the webhook URL from the Setting table
// =====================================================

import { getSetting } from '@/lib/settings-db';

export async function fireWebhook(event: string, data: Record<string, unknown>): Promise<void> {
  try {
    let webhookUrl = '';
    try {
      webhookUrl = (await getSetting('webhook_url')) || '';
    } catch {
      // DB not available
      return;
    }

    if (!webhookUrl || webhookUrl.trim() === '') return;

    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'verishield',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VeriShield-Webhook/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch {
    // Silently ignore webhook failures - don't block the main flow
  }
}
