// =====================================================
// VeriShield - Users API (GET all, POST create)
// Admin-only user management endpoints
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, requireAdmin } from '@/lib/auth-middleware';
import { getUsers, addUser, findUserByEmail } from '@/lib/user-store';
import { fireWebhook } from '@/lib/webhook';
import { hashPassword } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  const auth = validateAuth(request);
  if (!auth.valid) return auth.error;

  try {
    const { searchParams } = request.nextUrl;
    const delay = parseInt(searchParams.get('delay') || '0');
    const search = searchParams.get('search') || '';

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    let users = await getUsers();

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.valid) return auth.error;

  try {
    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await addUser({ email, name, password: hashedPassword, role });

    // Fire webhook asynchronously (don't block the response)
    fireWebhook('user.created', {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
    }).catch(() => {
      // Silently ignore webhook failures
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
