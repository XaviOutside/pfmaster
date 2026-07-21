import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClient } from './useClient';

const mockClient = {
  id: 42,
  name: 'Alice',
  email: 'alice@example.com',
  phone: '555-0101',
  phone2: null,
  address: null,
  status: 'active' as const,
  lastServiceDate: null,
  notes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockStorage = {
  getClient: vi.fn(),
};

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => mockStorage,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useClient', () => {
  it('fetches client by id', async () => {
    mockStorage.getClient.mockResolvedValueOnce(mockClient);

    const { result } = renderHook(() => useClient(42));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.client).toEqual(mockClient);
    expect(result.current.error).toBeNull();
  });

  it('handles 404 (client not found)', async () => {
    mockStorage.getClient.mockRejectedValueOnce(new Error('Client not found'));

    const { result } = renderHook(() => useClient(999));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.client).toBeNull();
    expect(result.current.error).toBe('Client not found');
  });

  it('returns null client when no id provided', () => {
    const { result } = renderHook(() => useClient(undefined));

    expect(result.current.client).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('re-fetches when id changes', async () => {
    mockStorage.getClient
      .mockResolvedValueOnce(mockClient)
      .mockResolvedValueOnce({ ...mockClient, id: 43, name: 'Bob' });

    const { result, rerender } = renderHook(
      (id: number | undefined) => useClient(id),
      { initialProps: 42 },
    );

    await waitFor(() => expect(result.current.client?.id).toBe(42));

    // Change id
    rerender(43);

    await waitFor(() => expect(result.current.client?.id).toBe(43));
    expect(result.current.client?.name).toBe('Bob');
  });
});
