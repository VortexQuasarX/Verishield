// =====================================================
// VeriShield - Settings API
// GET: Read settings mapped to Angular SettingsData format
// PUT: Accept SettingsData format, map back to key-value for storage
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

// Map flat DB key-value pairs → Angular SettingsData format
function toSettingsData(flat: Record<string, string>) {
  const turnaround = flat.default_turnaround ?? '7';
  return {
    defaultTurnaround: `${turnaround} hours`,
    autoEscalation: flat.auto_escalation === 'true',
    apiKey: flat.api_key ?? '',
    webhookUrl: flat.webhook_url ?? '',
    emailAlerts: flat.email_alerts === 'true',
    autoSealRecords: flat.auto_seal === 'true',
  };
}

// Map Angular SettingsData format → flat key-value pairs for DB storage
function fromSettingsData(data: Record<string, unknown>): Record<string, string> {
  const turnaround = String(data.defaultTurnaround ?? '7').replace(/\s*hours?\s*/i, '').trim() || '7';
  return {
    default_turnaround: turnaround,
    auto_escalation: String(data.autoEscalation ?? false),
    api_key: String(data.apiKey ?? ''),
    webhook_url: String(data.webhookUrl ?? ''),
    email_alerts: String(data.emailAlerts ?? false),
    auto_seal: String(data.autoSealRecords ?? false),
  };
}

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

    // Map flat key-value pairs to SettingsData format for Angular
    const mapped = toSettingsData(result);
    return NextResponse.json(mapped);
  } catch {
    // If DB fails, return defaults
    const result = { ...DEFAULT_SETTINGS };
    if (!result.api_key) {
      const random = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
      result.api_key = `vsh_live_${random}`;
    }
    const mapped = toSettingsData(result);
    return NextResponse.json(mapped);
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

    // Map SettingsData (camelCase) back to flat key-value pairs for storage
    const flatPairs = fromSettingsData(body);

    // Upsert each key-value pair sequentially to avoid SQLite lock issues
    for (const [key, value] of Object.entries(flatPairs)) {
      await upsertSetting(key, value);
    }

    // Return updated settings in SettingsData format
    const settings = await getAllSettings();
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of settings) {
      result[s.key] = s.value;
    }
    const mapped = toSettingsData(result);
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
