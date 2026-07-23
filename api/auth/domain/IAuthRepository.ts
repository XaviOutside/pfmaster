/**
 * Repository interface for the auth bounded context.
 * Domain types only — no Prisma, no Express, no framework imports.
 */
import { User } from './User';
import { Session, SessionWithUser } from './Session';

export interface IAuthRepository {
  /** Find a user by email (globally unique). Returns null if not found. */
  findUserByEmail(email: string): Promise<User | null>;

  /** Create a new session row. Returns the created session. */
  createSession(userId: number, companyId: number, expiresAt: Date): Promise<Session>;

  /** Find a valid (non-expired, non-deleted) session by token. Returns null if invalid. */
  findValidSession(token: string): Promise<SessionWithUser | null>;

  /** Soft-delete a session by setting deleted_at. Idempotent. */
  invalidateSession(token: string): Promise<void>;
}
