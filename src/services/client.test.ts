import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  reactivateClient,
  deactivateClient,
  searchClients,
} from './client';

const mockStorage = {
  listClients: vi.fn(),
  getClient: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
  reactivateClient: vi.fn(),
  deactivateClient: vi.fn(),
  searchClients: vi.fn(),
};

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => mockStorage,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listClients', () => {
  it('delegates to storage.listClients and returns typed response', async () => {
    const response = {
      data: [
        { id: 1, name: 'Alice', email: 'alice@example.com', phone: '555-0101', phone2: null, address: null, status: 'active' as const, notes: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    mockStorage.listClients.mockResolvedValueOnce(response);

    const result = await listClients();
    expect(result).toEqual(response);
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(mockStorage.listClients).toHaveBeenCalledWith(1, 20);
  });

  it('propagates error from storage', async () => {
    mockStorage.listClients.mockRejectedValueOnce(new Error('Network error'));

    await expect(listClients()).rejects.toThrow('Network error');
  });
});

describe('getClient', () => {
  it('delegates to storage.getClient by id', async () => {
    const client = { id: 42, name: 'Bob', email: 'bob@example.com', phone: '555-0102', phone2: null, address: null, status: 'active' as const, notes: null, createdAt: '', updatedAt: '' };
    mockStorage.getClient.mockResolvedValueOnce(client);

    const result = await getClient(42);
    expect(result).toEqual(client);
    expect(mockStorage.getClient).toHaveBeenCalledWith(42);
  });

  it('propagates 404 error from storage', async () => {
    mockStorage.getClient.mockRejectedValueOnce(new Error('Client not found'));

    await expect(getClient(999)).rejects.toThrow('Client not found');
  });
});

describe('createClient', () => {
  it('delegates to storage.createClient with dto', async () => {
    const dto = { name: 'New', email: 'new@example.com', phone: '555-0103' };
    const created = { id: 1, ...dto, phone2: null, address: null, status: 'active' as const, notes: null, createdAt: '', updatedAt: '' };
    mockStorage.createClient.mockResolvedValueOnce(created);

    const result = await createClient(dto);
    expect(result).toEqual(created);
    expect(mockStorage.createClient).toHaveBeenCalledWith(dto);
  });
});

describe('updateClient', () => {
  it('delegates to storage.updateClient with id and dto', async () => {
    const dto = { name: 'Updated' };
    const updated = { id: 1, name: 'Updated', email: 'a@b.com', phone: '555-0100', phone2: null, address: null, status: 'active' as const, notes: null, createdAt: '', updatedAt: '' };
    mockStorage.updateClient.mockResolvedValueOnce(updated);

    const result = await updateClient(1, dto);
    expect(result).toEqual(updated);
    expect(mockStorage.updateClient).toHaveBeenCalledWith(1, dto);
  });
});

describe('deleteClient', () => {
  it('delegates to storage.deleteClient and returns void', async () => {
    mockStorage.deleteClient.mockResolvedValueOnce(undefined);

    const result = await deleteClient(1);
    expect(result).toBeUndefined();
    expect(mockStorage.deleteClient).toHaveBeenCalledWith(1);
  });
});

describe('reactivateClient', () => {
  it('delegates to storage.reactivateClient', async () => {
    const client = { id: 1, name: 'A', email: 'a@b.com', phone: '555', phone2: null, address: null, status: 'active' as const, notes: null, createdAt: '', updatedAt: '' };
    mockStorage.reactivateClient.mockResolvedValueOnce(client);

    const result = await reactivateClient(1);
    expect(result).toEqual(client);
    expect(mockStorage.reactivateClient).toHaveBeenCalledWith(1);
  });
});

describe('deactivateClient', () => {
  it('delegates to storage.deactivateClient', async () => {
    const client = { id: 1, name: 'A', email: 'a@b.com', phone: '555', phone2: null, address: null, status: 'inactive' as const, notes: null, createdAt: '', updatedAt: '' };
    mockStorage.deactivateClient.mockResolvedValueOnce(client);

    const result = await deactivateClient(1);
    expect(result).toEqual(client);
    expect(mockStorage.deactivateClient).toHaveBeenCalledWith(1);
  });
});

describe('searchClients', () => {
  it('delegates to storage.searchClients with query', async () => {
    mockStorage.searchClients.mockResolvedValueOnce([]);

    const result = await searchClients('john doe');
    expect(result).toEqual([]);
    expect(mockStorage.searchClients).toHaveBeenCalledWith('john doe');
  });
});
