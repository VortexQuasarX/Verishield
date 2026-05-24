// =====================================================
// MPloyChek - Auth Login API
// Mock JWT authentication with role-based access
// =====================================================

import { NextRequest, NextResponse } from 'next/server';

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

const MOCK_USERS: MockUser[] = [
  { id: 'usr_admin', email: 'admin@mploychek.com', name: 'Rajesh Kumar', role: 'admin', isActive: true },
  { id: 'usr_user', email: 'user@mploychek.com', name: 'Anita Sharma', role: 'user', isActive: true },
];

function generateMockToken(user: MockUser): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  }));
  const signature = btoa(`mock-signature-${user.id}`);
  return `${header}.${payload}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    const user = MOCK_USERS.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Verify password based on role
    const validPassword = (email === 'admin@mploychek.com' && password === 'admin123') ||
                         (email === 'user@mploychek.com' && password === 'user123');

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED' },
        { status: 403 }
      );
    }

    const token = generateMockToken(user);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLogin: new Date().toISOString(),
        avatar: undefined,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
