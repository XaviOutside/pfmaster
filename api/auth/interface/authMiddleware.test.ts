/**
 * Unit tests for the auth middleware.
 * Repository is mocked — no DB connection required.
 *
 * Tests verify:
 * - Missing Authorization header → 401
 * - Malformed Bearer prefix → 401
 * - Invalid/expired token → 401
 * - Valid token → sets req.companyId, req.userId, req.role → calls next()
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response } from 'express';
import { createAuthMiddleware } from './authMiddleware';
import type { IAuthRepository } from '../domain/IAuthRepository';
import type { SessionWithUser } from '../domain/Session';

/** Stable SessionWithUser fixture */
const validSession: SessionWithUser = {
  token: '550e8400-e29b-41d4-a716-446655440000',
  userId: 1,
  role: 0,
  companyId: 1,
  companyName: 'Default Company',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

// Mock repository
const mockRepo = {
  findValidSession: vi.fn(),
} as unknown as IAuthRepository;

const makeAppWithMiddleware = () => {
  const app = express();
  app.use(express.json());
  // Apply auth middleware to protected routes
  app.use('/api/v1', createAuthMiddleware(mockRepo));
  // Protected endpoint that echoes the req fields
  app.get('/api/v1/protected', (req: Request, res: Response) => {
    res.json({
      companyId: req.companyId,
      userId: req.userId,
      role: req.role,
    });
  });
  return app;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authMiddleware — token extraction', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(makeAppWithMiddleware()).get('/api/v1/protected');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(mockRepo.findValidSession).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is empty string', async () => {
    const res = await request(makeAppWithMiddleware())
      .get('/api/v1/protected')
      .set('Authorization', '');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when Bearer prefix is missing', async () => {
    const res = await request(makeAppWithMiddleware())
      .get('/api/v1/protected')
      .set('Authorization', '550e8400-e29b-41d4-a716-446655440000');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('accepts Bearer token with case-insensitive prefix (e.g. "bearer")', async () => {
    (mockRepo.findValidSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(validSession);

    const res = await request(makeAppWithMiddleware())
      .get('/api/v1/protected')
      .set('Authorization', 'bearer 550e8400-e29b-41d4-a716-446655440000');

    // Case-insensitive prefix check → should authenticate
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ companyId: 1, userId: 1, role: 0 });
  });

  it('returns 401 when Bearer prefix is present but token is empty', async () => {
    const res = await request(makeAppWithMiddleware())
      .get('/api/v1/protected')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });
});

describe('authMiddleware — session validation', () => {
  it('returns 401 when token is not found in the database', async () => {
    (mockRepo.findValidSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const res = await request(makeAppWithMiddleware())
      .get('/api/v1/protected')
      .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(mockRepo.findValidSession).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000000',
    );
  });

  it('returns 401 when session is expired (repo returns null)', async () => {
    (mockRepo.findValidSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const res = await request(makeAppWithMiddleware())
      .get('/api/v1/protected')
      .set('Authorization', 'Bearer expired-token-00000000000000000');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });
});

describe('authMiddleware — successful authentication', () => {
  it('sets req.companyId, req.userId, req.role and calls next()', async () => {
    (mockRepo.findValidSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(validSession);

    const res = await request(makeAppWithMiddleware())
      .get('/api/v1/protected')
      .set('Authorization', 'Bearer 550e8400-e29b-41d4-a716-446655440000');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ companyId: 1, userId: 1, role: 0 });
    expect(mockRepo.findValidSession).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });
});
