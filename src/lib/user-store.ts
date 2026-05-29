// =====================================================
// VeriShield - Shared User Data Store
// Single source of truth for user data across API routes
// Uses Prisma DB for persistence — all functions are async
// =====================================================

import { db } from '@/lib/db';

// Prisma User type from the database
type DbUser = Awaited<ReturnType<typeof db.user.findUnique>>;

// Shape returned to API consumers (no password)
export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function toSafeUser(user: DbUser): SafeUser | null {
  if (!user) return null;
  const { password: _, ...safe } = user;
  return safe as SafeUser;
}

export async function getUsers(): Promise<SafeUser[]> {
  const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } });
  return users.map(u => toSafeUser(u)!);
}

export async function findUserById(id: string): Promise<SafeUser | null> {
  const user = await db.user.findUnique({ where: { id } });
  return toSafeUser(user);
}

export async function findUserByEmail(email: string): Promise<SafeUser | null> {
  const user = await db.user.findUnique({ where: { email } });
  return toSafeUser(user);
}

/** Find user with password field included — only for auth purposes */
export async function findUserByEmailWithPassword(email: string) {
  return db.user.findUnique({ where: { email } });
}

export async function addUser(data: {
  email: string;
  name: string;
  password: string;
  role?: string;
  isActive?: boolean;
  avatar?: string;
}): Promise<SafeUser> {
  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password,
      role: data.role || 'user',
      isActive: data.isActive ?? true,
      avatar: data.avatar || null,
    },
  });
  return toSafeUser(user)!;
}

export async function updateUser(id: string, updates: Partial<Omit<SafeUser, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SafeUser | null> {
  try {
    const user = await db.user.update({
      where: { id },
      data: updates,
    });
    return toSafeUser(user);
  } catch {
    // Prisma throws if record not found
    return null;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await db.user.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
