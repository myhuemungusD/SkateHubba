/**
 * User Service - Database abstraction layer for user operations
 * 
 * Single source of truth for user data: PostgreSQL customUsers table
 * Firebase Auth is used ONLY for authentication, not profile storage
 */

<<<<<<< HEAD
import { eq, and } from 'drizzle-orm';
import { db, requireDb } from '../db';
import { customUsers, type CustomUser } from '@shared/schema';
import logger from '../logger';

=======
import { eq } from 'drizzle-orm';
import { db, requireDb } from '../db';
import { users } from '@shared/schema';
import logger from '../logger';

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
export interface CreateUserInput {
  id: string; // Firebase UID
  email: string;
  firstName?: string | null;
  lastName?: string | null;
<<<<<<< HEAD
  phoneNumber?: string | null;
  roles?: string[];
=======
  profileImageUrl?: string | null;
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
}

export interface UpdateUserInput {
  firstName?: string | null;
  lastName?: string | null;
<<<<<<< HEAD
  bio?: string | null;
  location?: string | null;
  phoneNumber?: string | null;
  photoUrl?: string | null;
=======
  profileImageUrl?: string | null;
  onboardingCompleted?: boolean;
  currentTutorialStep?: number;
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
}

/**
 * Create a new user record in PostgreSQL
 * Called after Firebase Auth user creation
 */
<<<<<<< HEAD
export async function createUser(input: CreateUserInput): Promise<CustomUser> {
=======
export async function createUser(input: CreateUserInput): Promise<User> {
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
  const database = requireDb();
  
  logger.info('Creating user in PostgreSQL', { userId: input.id, email: input.email });
  
<<<<<<< HEAD
  const [user] = await database.insert(customUsers).values({
=======
  const [user] = await database.insert(users).values({
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
    id: input.id,
    email: input.email,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
<<<<<<< HEAD
    phoneNumber: input.phoneNumber ?? null,
    roles: input.roles ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
=======
    profileImageUrl: input.profileImageUrl ?? null,
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
  }).returning();
  
  logger.info('User created successfully', { userId: user.id });
  return user;
}

/**
 * Get user by Firebase UID
 */
<<<<<<< HEAD
export async function getUserById(userId: string): Promise<CustomUser | null> {
  if (!db) return null;
  
  const users = await db.select()
    .from(customUsers)
    .where(eq(customUsers.id, userId))
    .limit(1);
  
  return users[0] ?? null;
=======
export async function getUserById(userId: string): Promise<User | null> {
  if (!db) return null;
  
  const results = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return results[0] ?? null;
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
}

/**
 * Get user by email
 */
<<<<<<< HEAD
export async function getUserByEmail(email: string): Promise<CustomUser | null> {
  if (!db) return null;
  
  const users = await db.select()
    .from(customUsers)
    .where(eq(customUsers.email, email))
    .limit(1);
  
  return users[0] ?? null;
=======
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!db) return null;
  
  const results = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return results[0] ?? null;
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
}

/**
 * Update user profile
 */
<<<<<<< HEAD
export async function updateUser(userId: string, input: UpdateUserInput): Promise<CustomUser> {
=======
export async function updateUser(userId: string, input: UpdateUserInput): Promise<User> {
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
  const database = requireDb();
  
  logger.info('Updating user profile', { userId });
  
<<<<<<< HEAD
  const [updated] = await database.update(customUsers)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(customUsers.id, userId))
=======
  const [updated] = await database.update(users)
    .set(input)
    .where(eq(users.id, userId))
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
    .returning();
  
  if (!updated) {
    throw new Error(`User ${userId} not found`);
  }
  
  logger.info('User profile updated', { userId });
  return updated;
}

/**
<<<<<<< HEAD
 * Update user roles (admin only)
 */
export async function updateUserRoles(userId: string, roles: string[]): Promise<CustomUser> {
  const database = requireDb();
  
  logger.info('Updating user roles', { userId, roles });
  
  const [updated] = await database.update(customUsers)
    .set({
      roles,
      updatedAt: new Date(),
    })
    .where(eq(customUsers.id, userId))
    .returning();
  
  if (!updated) {
    throw new Error(`User ${userId} not found`);
  }
  
  logger.info('User roles updated', { userId, roles });
  return updated;
}

/**
 * Check if user has a specific role
 */
export async function userHasRole(userId: string, role: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;
  
  return user.roles?.includes(role) ?? false;
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return userHasRole(userId, 'admin');
}

/**
 * Check if user is verified pro
 */
export async function isVerifiedPro(userId: string): Promise<boolean> {
  return userHasRole(userId, 'verified_pro');
}

/**
 * Delete user (soft delete - set inactive)
=======
 * NOTE: Role management is handled by Firebase Custom Claims, not database.
 * Use Firebase Admin SDK to set/get user roles via custom claims.
 * See scripts/set-admin.ts for example.
 */

/**
 * Delete user (removes from database)
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
 */
export async function deleteUser(userId: string): Promise<void> {
  const database = requireDb();
  
<<<<<<< HEAD
  logger.warn('Soft deleting user', { userId });
  
  await database.update(customUsers)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(customUsers.id, userId));
  
  logger.info('User soft deleted', { userId });
=======
  logger.warn('Deleting user', { userId });
  
  await database.delete(users)
    .where(eq(users.id, userId));
  
  logger.info('User deleted', { userId });
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
}

/**
 * Get or create user (idempotent)
 * Useful for OAuth flows where we might not know if user exists
 */
<<<<<<< HEAD
export async function getOrCreateUser(input: CreateUserInput): Promise<CustomUser> {
=======
export async function getOrCreateUser(input: CreateUserInput): Promise<User> {
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
  const existing = await getUserById(input.id);
  if (existing) {
    return existing;
  }
<<<<<<< HEAD
  
  return createUser(input);
=======

  try {
    // Attempt to create the user. This may race with another concurrent request.
    return await createUser(input);
  } catch (err) {
    // If another request inserted the same user concurrently, the database
    // should raise a unique-constraint violation. In that case, re-read.
    const code = (err as any)?.code;
    if (code === '23505') {
      const user = await getUserById(input.id);
      if (user) {
        return user;
      }
    }

    // For non-unique-violation errors, or if re-reading failed, rethrow.
    throw err;
  }
>>>>>>> 7d0ee4c960b5f98af3743fdcc9837638d0889408
}
