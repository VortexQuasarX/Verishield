// =====================================================
// VeriShield - Cryptographic Utilities
// Real password hashing with scrypt and data sealing with SHA-256
// JWT signing/verification with HMAC-SHA256
// =====================================================

import crypto from 'crypto';

const SCRYPT_KEY_LENGTH = 64;
const SALT_LENGTH = 32;

/**
 * Hash a password using scrypt with a random salt.
 * Returns a `salt:hash` formatted string for storage.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a password against a stored salt:hash string.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const storedHashBuffer = Buffer.from(hashHex, 'hex');
  const computedHash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);

  // Use timing-safe comparison to prevent timing attacks
  if (computedHash.length !== storedHashBuffer.length) return false;
  return crypto.timingSafeEqual(computedHash, storedHashBuffer);
}

/**
 * Create a SHA-256 seal of record data.
 * Sorts keys alphabetically for deterministic hashing.
 * Returns hex string prefixed with "0x".
 */
export function sealRecord(data: Record<string, unknown>): string {
  const sortedData: Record<string, unknown> = {};
  for (const key of Object.keys(data).sort()) {
    sortedData[key] = data[key];
  }
  const jsonString = JSON.stringify(sortedData);
  const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
  return `0x${hash}`;
}

/**
 * Verify that data matches a given seal hash.
 */
export function verifySeal(data: Record<string, unknown>, sealHash: string): boolean {
  const computedHash = sealRecord(data);
  return computedHash === sealHash;
}

// ---- JWT Signing & Verification (HMAC-SHA256) ----

// JWT Secret — in production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'verishield-jwt-secret-key-2024-hmac-sha256';
const JWT_ALGORITHM = 'HS256';

/**
 * Generate a real JWT token signed with HMAC-SHA256.
 * Format: base64url(header).base64url(payload).base64url(signature)
 */
export function generateToken(payload: { sub: string; email: string; role: string }): string {
  const header = { alg: JWT_ALGORITHM, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 86400, // 24 hours
  };

  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(tokenPayload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verify a JWT token's HMAC-SHA256 signature and return the payload.
 * Returns null if the token is invalid or expired.
 */
export function verifyToken(token: string): { sub: string; email: string; role: string; iat: number; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (signature !== expectedSignature) return null;

    // Decode payload
    const payload = JSON.parse(base64urlDecode(payloadB64));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  // Restore base64 padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}
