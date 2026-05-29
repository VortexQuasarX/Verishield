// =====================================================
// VeriShield Pro - AI SDK Helper
// Singleton instance of z-ai-web-dev-sdk for all AI routes
// =====================================================

import ZAI from 'z-ai-web-dev-sdk';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

/**
 * Helper to handle the ?delay=X query parameter for latency simulation
 */
export async function applyDelay(request: Request): Promise<void> {
  const url = new URL(request.url);
  const delay = parseInt(url.searchParams.get('delay') || '0');
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
