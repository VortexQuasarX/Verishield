// =====================================================
// MPloyChek - Individual User API (PUT, DELETE)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateMockUsers } from '@/lib/mock-data';
import type { AuthUser } from '@/types';

let mockUsers: AuthUser[] = generateMockUsers();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    mockUsers[index] = {
      ...mockUsers[index],
      ...(body.email && { email: body.email }),
      ...(body.name && { name: body.name }),
      ...(body.role && { role: body.role }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    };

    return NextResponse.json(mockUsers[index]);
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const index = mockUsers.findIndex(u => u.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    mockUsers = mockUsers.filter(u => u.id !== id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
