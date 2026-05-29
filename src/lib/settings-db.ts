// =====================================================
// VeriShield - Settings Database Helper
// Uses raw SQL exclusively to avoid stale PrismaClient
// model accessor issues during development
// =====================================================

import { db } from '@/lib/db';

interface SettingRow {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAllSettings(): Promise<SettingRow[]> {
  try {
    return await db.$queryRaw<SettingRow[]>`SELECT * FROM Setting`;
  } catch {
    return [];
  }
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  const existing = await db.$queryRaw<Array<{ id: string }>>`SELECT id FROM Setting WHERE key = ${key}`;
  if (existing.length > 0) {
    await db.$executeRaw`UPDATE Setting SET value = ${value}, updatedAt = datetime('now') WHERE key = ${key}`;
  } else {
    const id = crypto.randomUUID();
    await db.$executeRaw`INSERT INTO Setting (id, key, value, createdAt, updatedAt) VALUES (${id}, ${key}, ${value}, datetime('now'), datetime('now'))`;
  }
}

export async function getSetting(key: string): Promise<string | null> {
  try {
    const result = await db.$queryRaw<Array<{ value: string }>>`SELECT value FROM Setting WHERE key = ${key}`;
    return result.length > 0 ? result[0].value : null;
  } catch {
    return null;
  }
}
