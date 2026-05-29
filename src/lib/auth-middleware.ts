// =====================================================
// VeriShield - API Auth Middleware
// Validates Bearer token on protected API routes
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/crypto';

interface TokenPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
}

export function validateAuth(request: NextRequest): { valid: boolean; payload?: TokenPayload; error?: NextResponse } {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      ),
    };
  }

  return { valid: true, payload: payload as TokenPayload };
}

export function requireAdmin(request: NextRequest): { valid: boolean; payload?: TokenPayload; error?: NextResponse } {
  const authResult = validateAuth(request);
  if (!authResult.valid) return authResult;

  if (authResult.payload?.role !== 'admin') {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

// ---- API Key Validation ----
// Checks for X-API-Key header or ?apiKey= query param
// Looks up the key in the Setting table where key='api_key'
export async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; error?: NextResponse }> {
  // Try header first, then query param
  const apiKey = request.headers.get('X-API-Key') || request.nextUrl.searchParams.get('apiKey');

  if (!apiKey) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'API key required. Provide X-API-Key header or apiKey query parameter.', code: 'API_KEY_MISSING' },
        { status: 401 }
      ),
    };
  }

  try {
    const { getSetting } = await import('@/lib/settings-db');
    const storedKey = await getSetting('api_key');

    if (!storedKey) {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'No API key configured. Generate one in Admin Settings.', code: 'API_KEY_NOT_CONFIGURED' },
          { status: 500 }
        ),
      };
    }

    if (storedKey !== apiKey) {
      return {
        valid: false,
        error: NextResponse.json(
          { error: 'Invalid API key', code: 'API_KEY_INVALID' },
          { status: 401 }
        ),
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Unable to validate API key', code: 'API_KEY_VALIDATION_ERROR' },
        { status: 500 }
      ),
    };
  }
}
