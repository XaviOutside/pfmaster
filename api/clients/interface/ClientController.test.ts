/**
 * Supertest tests for ClientController routes.
 * Use cases are mocked — no DB connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// Mock use cases before importing the router
const mockCreateClient = vi.fn();
const mockGetClient = vi.fn();
const mockListClients = vi.fn();
const mockUpdateClient = vi.fn();
const mockDeactivateClient = vi.fn();
const mockSoftDeleteClient = vi.fn();
const mockSearchClients = vi.fn();

vi.mock('../application/CreateClient', () => ({
  CreateClientUseCase: vi.fn().mockImplementation(() => ({
    execute: mockCreateClient,
  })),
}));

vi.mock('../application/GetClient', () => ({
  GetClientUseCase: vi.fn().mockImplementation(() => ({
    execute: mockGetClient,
  })),
}));

vi.mock('../application/ListClients', () => ({
  ListClientsUseCase: vi.fn().mockImplementation(() => ({
    execute: mockListClients,
  })),
}));

vi.mock('../application/UpdateClient', () => ({
  UpdateClientUseCase: vi.fn().mockImplementation(() => ({
    execute: mockUpdateClient,
  })),
}));

vi.mock('../application/DeactivateClient', () => ({
  DeactivateClientUseCase: vi.fn().mockImplementation(() => ({
    execute: mockDeactivateClient,
  })),
}));

vi.mock('../application/SoftDeleteClient', () => ({
  SoftDeleteClientUseCase: vi.fn().mockImplementation(() => ({
    execute: mockSoftDeleteClient,
  })),
}));

vi.mock('../application/SearchClients', () => ({
  SearchClientsUseCase: vi.fn().mockImplementation(() => ({
    execute: mockSearchClients,
  })),
}));

// Mock Prisma to avoid DB connection in unit tests
vi.mock('@api/shared/infrastructure/prisma', () => ({
  prisma: {},
}));

import { clientRouter } from './clientRouter';

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/clients', clientRouter);
  // Generic error boundary for unexpected throws in tests
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
};

/** Stable domain client fixture — used in multiple tests */
const domainClient = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0001',
  phone2: null,
  address: null,
  status: 1 as const,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

/** Expected DTO shape for domainClient */
const expectedDto = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0001',
  phone2: null,
  address: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/v1/clients', () => {
  it('returns 201 with ClientResponseDto on success', async () => {
    mockCreateClient.mockResolvedValueOnce(domainClient);

    const res = await request(makeApp())
      .post('/api/v1/clients')
      .send({ name: 'John Doe', email: 'john@example.com', phone: '555-0001' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(expectedDto);
    expect(res.body).not.toHaveProperty('deletedAt');
  });

  it('returns 422 when name is missing', async () => {
    const { ClientValidationError } = await import('../domain/ClientErrors');
    mockCreateClient.mockRejectedValueOnce(new ClientValidationError('Name is required'));

    const res = await request(makeApp())
      .post('/api/v1/clients')
      .send({ email: 'john@example.com', phone: '555-0001' });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body).not.toHaveProperty('stack');
  });

  it('returns 422 when email is invalid', async () => {
    const { ClientValidationError } = await import('../domain/ClientErrors');
    mockCreateClient.mockRejectedValueOnce(
      new ClientValidationError('Email must be a valid email address'),
    );

    const res = await request(makeApp())
      .post('/api/v1/clients')
      .send({ name: 'John Doe', email: 'not-an-email', phone: '555-0001' });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/v1/clients', () => {
  it('returns 200 with paginated list', async () => {
    mockListClients.mockResolvedValueOnce([domainClient]);

    const res = await request(makeApp()).get('/api/v1/clients');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject(expectedDto);
    expect(res.body[0]).not.toHaveProperty('deletedAt');
  });
});

describe('GET /api/v1/clients/:id', () => {
  it('returns 200 with client', async () => {
    mockGetClient.mockResolvedValueOnce(domainClient);

    const res = await request(makeApp()).get('/api/v1/clients/1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(expectedDto);
    expect(res.body).not.toHaveProperty('deletedAt');
  });

  it('returns 404 when not found', async () => {
    const { ClientNotFoundError } = await import('../domain/ClientErrors');
    mockGetClient.mockRejectedValueOnce(new ClientNotFoundError(999));

    const res = await request(makeApp()).get('/api/v1/clients/999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 when id is non-numeric', async () => {
    const res = await request(makeApp()).get('/api/v1/clients/abc');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PUT /api/v1/clients/:id', () => {
  it('returns 200 with updated client', async () => {
    const updated = { ...domainClient, name: 'Jane Doe' };
    mockUpdateClient.mockResolvedValueOnce(updated);

    const res = await request(makeApp())
      .put('/api/v1/clients/1')
      .send({ name: 'Jane Doe' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Jane Doe');
  });

  it('returns 404 when client not found', async () => {
    const { ClientNotFoundError } = await import('../domain/ClientErrors');
    mockUpdateClient.mockRejectedValueOnce(new ClientNotFoundError(999));

    const res = await request(makeApp())
      .put('/api/v1/clients/999')
      .send({ name: 'Updated' });

    expect(res.status).toBe(404);
  });

  it('returns 422 when status field is included in body (rejected)', async () => {
    const res = await request(makeApp())
      .put('/api/v1/clients/1')
      .send({ name: 'Updated', status: 0 });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/v1/clients/:id/deactivate', () => {
  it('returns 200 with deactivated client', async () => {
    const deactivated = { ...domainClient, status: 0 as const };
    mockDeactivateClient.mockResolvedValueOnce(deactivated);

    const res = await request(makeApp()).patch('/api/v1/clients/1/deactivate');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inactive');
  });

  it('returns 404 when client not found', async () => {
    const { ClientNotFoundError } = await import('../domain/ClientErrors');
    mockDeactivateClient.mockRejectedValueOnce(new ClientNotFoundError(999));

    const res = await request(makeApp()).patch('/api/v1/clients/999/deactivate');

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/clients/:id', () => {
  it('returns 204 no content', async () => {
    mockSoftDeleteClient.mockResolvedValueOnce(undefined);

    const res = await request(makeApp()).delete('/api/v1/clients/1');

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 404 when client not found', async () => {
    const { ClientNotFoundError } = await import('../domain/ClientErrors');
    mockSoftDeleteClient.mockRejectedValueOnce(new ClientNotFoundError(999));

    const res = await request(makeApp()).delete('/api/v1/clients/999');

    expect(res.status).toBe(404);
  });

  it('returns 409 when client is already deleted', async () => {
    const { ClientAlreadyDeletedError } = await import('../domain/ClientErrors');
    mockSoftDeleteClient.mockRejectedValueOnce(new ClientAlreadyDeletedError(1));

    const res = await request(makeApp()).delete('/api/v1/clients/1');

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/v1/clients/search', () => {
  it('returns 200 with search results', async () => {
    mockSearchClients.mockResolvedValueOnce([domainClient]);

    const res = await request(makeApp()).get('/api/v1/clients/search?q=john');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject(expectedDto);
    expect(res.body[0]).not.toHaveProperty('deletedAt');
  });

  it('returns 400 when q param is missing', async () => {
    const res = await request(makeApp()).get('/api/v1/clients/search');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 200 with empty array when no results', async () => {
    mockSearchClients.mockResolvedValueOnce([]);

    const res = await request(makeApp()).get('/api/v1/clients/search?q=zzznomatch');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('Error handling', () => {
  it('returns 500 without stack trace in body for unexpected errors', async () => {
    mockGetClient.mockRejectedValueOnce(new Error('Unexpected database error'));

    const res = await request(makeApp()).get('/api/v1/clients/1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(res.body).not.toHaveProperty('stack');
  });
});
