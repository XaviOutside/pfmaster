import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  deactivatePet,
  searchPets,
} from './pet';

const mockStorage = {
  listPets: vi.fn(),
  getPet: vi.fn(),
  createPet: vi.fn(),
  updatePet: vi.fn(),
  deletePet: vi.fn(),
  deactivatePet: vi.fn(),
  searchPets: vi.fn(),
};

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => mockStorage,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const samplePet = {
  id: 1,
  clientId: 10,
  name: 'Max',
  species: 'Dog',
  breed: 'Golden Retriever',
  sex: 'male' as const,
  dateOfBirth: '2020-03-15T00:00:00.000Z',
  weightKg: 32.5,
  notes: 'Friendly, likes treats',
  status: 'active' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('listPets', () => {
  it('delegates to storage.listPets and returns typed response', async () => {
    const response = {
      data: [samplePet],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    mockStorage.listPets.mockResolvedValueOnce(response);

    const result = await listPets();
    expect(result).toEqual(response);
    expect(result.data).toEqual([samplePet]);
    expect(result.meta.total).toBe(1);
    expect(mockStorage.listPets).toHaveBeenCalledWith(1, 20, undefined);
  });

  it('passes custom page and limit', async () => {
    mockStorage.listPets.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 2, limit: 10, totalPages: 0 } });

    await listPets(2, 10);
    expect(mockStorage.listPets).toHaveBeenCalledWith(2, 10, undefined);
  });

  it('passes clientId when provided', async () => {
    mockStorage.listPets.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

    await listPets(1, 20, 10);
    expect(mockStorage.listPets).toHaveBeenCalledWith(1, 20, 10);
  });

  it('propagates error from storage', async () => {
    mockStorage.listPets.mockRejectedValueOnce(new Error('Network error'));

    await expect(listPets()).rejects.toThrow('Network error');
  });
});

describe('getPet', () => {
  it('delegates to storage.getPet by id', async () => {
    mockStorage.getPet.mockResolvedValueOnce(samplePet);

    const result = await getPet(1);
    expect(result).toEqual(samplePet);
    expect(mockStorage.getPet).toHaveBeenCalledWith(1);
  });

  it('propagates 404 error from storage', async () => {
    mockStorage.getPet.mockRejectedValueOnce(new Error('Pet not found'));

    await expect(getPet(999)).rejects.toThrow('Pet not found');
  });
});

describe('createPet', () => {
  it('delegates to storage.createPet with input', async () => {
    const input = { clientId: 10, name: 'Bella', species: 'Dog', breed: 'Labrador' };
    const created = { id: 2, ...input, sex: 'unknown' as const, dateOfBirth: null, weightKg: null, notes: null, status: 'active' as const, createdAt: '', updatedAt: '' };
    mockStorage.createPet.mockResolvedValueOnce(created);

    const result = await createPet(input);
    expect(result).toEqual(created);
    expect(mockStorage.createPet).toHaveBeenCalledWith(input);
  });
});

describe('updatePet', () => {
  it('delegates to storage.updatePet with id and input', async () => {
    const input = { name: 'Maximus' };
    const updated = { ...samplePet, name: 'Maximus' };
    mockStorage.updatePet.mockResolvedValueOnce(updated);

    const result = await updatePet(1, input);
    expect(result).toEqual(updated);
    expect(mockStorage.updatePet).toHaveBeenCalledWith(1, input);
  });
});

describe('deletePet', () => {
  it('delegates to storage.deletePet and returns void', async () => {
    mockStorage.deletePet.mockResolvedValueOnce(undefined);

    const result = await deletePet(1);
    expect(result).toBeUndefined();
    expect(mockStorage.deletePet).toHaveBeenCalledWith(1);
  });
});

describe('deactivatePet', () => {
  it('delegates to storage.deactivatePet', async () => {
    const deactivated = { ...samplePet, status: 'inactive' as const };
    mockStorage.deactivatePet.mockResolvedValueOnce(deactivated);

    const result = await deactivatePet(1);
    expect(result).toEqual(deactivated);
    expect(mockStorage.deactivatePet).toHaveBeenCalledWith(1);
  });
});

describe('searchPets', () => {
  it('delegates to storage.searchPets with query', async () => {
    mockStorage.searchPets.mockResolvedValueOnce([]);

    const result = await searchPets('golden retriever');
    expect(result).toEqual([]);
    expect(mockStorage.searchPets).toHaveBeenCalledWith('golden retriever');
  });
});
