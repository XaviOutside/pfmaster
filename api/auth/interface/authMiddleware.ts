import type { Request, Response, NextFunction } from 'express';
import { logger } from '@api/observability/logger';
import type { IAuthRepository } from '../domain/IAuthRepository';

/**
 * Express type augmentation — adds auth fields to the Request interface.
 * Every controller receives req.companyId, req.userId, and req.role after
 * the auth middleware validates the session.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      companyId: number;
      userId: number;
      role: number;
    }
  }
}

/**
 * Extracts the token from a Bearer authorization header.
 * Case-insensitive prefix check. Returns null if missing or malformed.
 */
function extractBearerToken(authHeader: string): string | null {
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return null;
  if (parts[0].toLowerCase() !== 'bearer') return null;

  const token = parts[1].trim();
  if (!token) return null;

  return token;
}

/**
 * Creates an Express middleware that validates the Bearer token from the
 * Authorization header against the session store.
 *
 * On success: attaches companyId, userId, role to req and calls next().
 * On failure: returns 401 { error: "Unauthorized" }.
 *
 * @param repo - Auth repository for session lookup
 */
export function createAuthMiddleware(repo: IAuthRepository) {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const authHeader = req.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = extractBearerToken(authHeader);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const session = await repo.findValidSession(token);
    if (!session) {
      logger.warn({ token: token.substring(0, 8) + '...' }, 'Invalid or expired session');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Attach session data to the request — all downstream handlers use these
    req.companyId = session.companyId;
    req.userId = session.userId;
    req.role = session.role;

    next();
  };
}
