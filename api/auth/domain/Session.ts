/**
 * Session domain entity — zero framework or DB imports.
 */
export interface Session {
  id: number;
  token: string;
  userId: number;
  companyId: number;
  expiresAt: Date;
  createdAt: Date;
  deletedAt: Date | null;
}

/**
 * Session enriched with user and company data for middleware lookup.
 * Returned by IAuthRepository.findValidSession() via JOIN query.
 */
export interface SessionWithUser {
  token: string;
  userId: number;
  role: number;
  companyId: number;
  companyName: string;
  expiresAt: Date;
}
