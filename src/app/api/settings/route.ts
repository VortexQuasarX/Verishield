// =====================================================
// VeriShield - Settings API
// GET: Read all settings from DB as key-value object
// PUT: Upsert settings into DB
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, requireAdmin } from '@/lib/auth-middleware';
import { getAllSettings, upsertSetting } from '@/lib/settings-db';

// Default settings when DB is empty
const DEFAULT_SETTINGS: Record<string, string> = {
  default_turnaround: '7',
  auto_escalation: 'true',
  escalation_hours: '48',
  api_key: '',
  webhook_url: '',
  email_alerts: 'true',
  threshold_alerts: 'true',
  high_risk_threshold: '80',
  auto_seal: 'true',
  retention_period: '365',
};

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const settings = await getAllSettings();
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };

    for (const s of settings) {
      result[s.key] = s.value;
    }

    // Auto-generate API key if not set
    if (!result.api_key) {
      const random = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
      result.api_key = `vsh_live_${random}`;
      try {
        await upsertSetting('api_key', result.api_key);
      } catch {
        // Non-critical - key will be regenerated on next GET
      }
    }

    return NextResponse.json(result);
  } catch {
    // If DB fails, return defaults
    const result = { ...DEFAULT_SETTINGS };
    if (!result.api_key) {
      const random = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
      result.api_key = `vsh_live_${random}`;
    }
    return NextResponse.json(result);
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }

    // Upsert each key-value pair sequentially to avoid SQLite lock issues
    for (const [key, value] of Object.entries(body)) {
      await upsertSetting(key, String(value));
    }

    // Return updated settings
    const settings = await getAllSettings();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
