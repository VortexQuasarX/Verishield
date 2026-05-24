// =====================================================
// MPloyChek - Users API (GET all, POST create)
// Admin-only user management endpoints
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateMockUsers } from '@/lib/mock-data';
import type { AuthUser } from '@/types';

let mockUsers: AuthUser[] = generateMockUsers();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const delay = parseInt(searchParams.get('delay') || '0');
    const search = searchParams.get('search') || '';

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    let users = [...mockUsers];

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
  try {
    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    if (mockUsers.find(u => u.email === email)) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const newUser: AuthUser = {
      id: `usr_${Date.now()}`,
      email,
      name,
      role: role || 'user',
      isActive: true,
      lastLogin: undefined,
      avatar: undefined,
    };

    mockUsers = [newUser, ...mockUsers];

    return NextResponse.json(newUser, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
