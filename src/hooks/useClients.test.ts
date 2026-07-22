import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useClients } from './useClients';

const mockClients = [
  { id: 1, name: 'Alice', email: 'alice@example.com', phone: '555-0101', phone2: null, address: null, status: 'active' as const, lastServiceDate: null, notes: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Bob', email: 'bob@example.com', phone: '555-0102', phone2: null, address: null, status: 'inactive' as const, lastServiceDate: null, notes: null, createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
];

const mockStorage = {
  listClients: vi.fn(),
  searchClients: vi.fn(),
};

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => mockStorage,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useClients', () => {
  it('starts in loading state with pagination defaults', () => {
    mockStorage.listClients.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

    const { result } = renderHook(() => useClients());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.clients).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it('fetches and returns clients on mount with pagination metadata', async () => {
    mockStorage.listClients.mockResolvedValueOnce({ data: mockClients, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } });

    const { result } = renderHook(() => useClients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.clients).toEqual(mockClients);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.hasPreviousPage).toBe(false);
  });

  it('handles fetch failure', async () => {
    mockStorage.listClients.mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useClients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.clients).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('search updates results via searchClients API', async () => {
    // First call: initial list
    mockStorage.listClients.mockResolvedValueOnce({ data: mockClients, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } });
    // Second call: search
    mockStorage.searchClients.mockResolvedValueOnce([mockClients[0]]);

    const { result } = renderHook(() => useClients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.search('alice');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.clients).toHaveLength(1);
    expect(result.current.clients[0].name).toBe('Alice');
  });
});
