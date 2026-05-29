// =====================================================
// VeriShield - Auth Login API
// JWT authentication with role-based access via Prisma DB
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmailWithPassword, updateUser } from '@/lib/user-store';
import { verifyPassword, generateToken } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    // Look up user from Prisma DB (includes password field)
    const user = await findUserByEmailWithPassword(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // If a role was specified in the login request, verify it matches the user's role
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `This account does not have ${role} access. Please select the correct role.`, code: 'ROLE_MISMATCH' },
        { status: 403 }
      );
    }

    // Verify password using scrypt hash
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
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

    // Update lastLogin timestamp
    await updateUser(user.id, { lastLogin: new Date() });

    const token = generateToken({ sub: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLogin: new Date().toISOString(),
        avatar: user.avatar,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
