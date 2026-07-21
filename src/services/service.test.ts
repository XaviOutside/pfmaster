import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listServices,
  getService,
  createService,
  updateService,
  deactivateService,
  deleteService,
  searchServices,
} from './service';
import type { Service, CreateServiceInput } from '@/types/service';

const mockStorage = {
  listServices: vi.fn(),
  getService: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
  deactivateService: vi.fn(),
  searchServices: vi.fn(),
};

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => mockStorage,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const mockService: Service = {
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming',
  durationMinutes: 60,
  price: 50.00,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('listServices', () => {
  it('delegates to storage.listServices with default params', async () => {
    const response = { data: [mockService], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
    mockStorage.listServices.mockResolvedValueOnce(response);

    const result = await listServices();

    expect(result).toEqual(response);
    expect(result.data).toEqual([mockService]);
    expect(result.meta.total).toBe(1);
    expect(mockStorage.listServices).toHaveBeenCalledWith(1, 20, undefined);
  });

  it('passes custom page and limit', async () => {
    const response = { data: [], meta: { total: 0, page: 2, limit: 10, totalPages: 0 } };
    mockStorage.listServices.mockResolvedValueOnce(response);

    await listServices(2, 10);

    expect(mockStorage.listServices).toHaveBeenCalledWith(2, 10, undefined);
  });

  it('passes petId when provided', async () => {
    const response = { data: [mockService], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
    mockStorage.listServices.mockResolvedValueOnce(response);

    await listServices(1, 20, 5);

    expect(mockStorage.listServices).toHaveBeenCalledWith(1, 20, 5);
  });

  it('does not include petId when omitted', async () => {
    const response = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    mockStorage.listServices.mockResolvedValueOnce(response);

    await listServices(1, 20);

    expect(mockStorage.listServices).toHaveBeenCalledWith(1, 20, undefined);
  });
});

describe('getService', () => {
  it('delegates to storage.getService by id', async () => {
    mockStorage.getService.mockResolvedValueOnce(mockService);

    const result = await getService(1);

    expect(result).toEqual(mockService);
    expect(mockStorage.getService).toHaveBeenCalledWith(1);
  });
});

describe('createService', () => {
  it('delegates to storage.createService with input', async () => {
    mockStorage.createService.mockResolvedValueOnce({ ...mockService, id: 3 });

    const input: CreateServiceInput = {
      name: 'Nail Trim',
      price: 15.00,
      durationMinutes: 30,
    };
    const result = await createService(input);

    expect(result.id).toBe(3);
    expect(mockStorage.createService).toHaveBeenCalledWith(input);
  });
});

describe('updateService', () => {
  it('delegates to storage.updateService with id and input', async () => {
    mockStorage.updateService.mockResolvedValueOnce({ ...mockService, name: 'Deluxe' });

    const result = await updateService(1, { name: 'Deluxe', price: 75 });

    expect(result.name).toBe('Deluxe');
    expect(mockStorage.updateService).toHaveBeenCalledWith(1, { name: 'Deluxe', price: 75 });
  });
});

describe('deactivateService', () => {
  it('delegates to storage.deactivateService', async () => {
    mockStorage.deactivateService.mockResolvedValueOnce({ ...mockService, status: 'inactive' });

    const result = await deactivateService(1);

    expect(result.status).toBe('inactive');
    expect(mockStorage.deactivateService).toHaveBeenCalledWith(1);
  });
});

describe('deleteService', () => {
  it('delegates to storage.deleteService and returns void', async () => {
    mockStorage.deleteService.mockResolvedValueOnce(undefined);

    const result = await deleteService(1);

    expect(result).toBeUndefined();
    expect(mockStorage.deleteService).toHaveBeenCalledWith(1);
  });
});

describe('searchServices', () => {
  it('delegates to storage.searchServices with query', async () => {
    mockStorage.searchServices.mockResolvedValueOnce([mockService]);

    const result = await searchServices('groom');

    expect(result).toEqual([mockService]);
    expect(mockStorage.searchServices).toHaveBeenCalledWith('groom');
  });

  it('passes special character query as-is', async () => {
    mockStorage.searchServices.mockResolvedValueOnce([]);

    const result = await searchServices('cut & style');
    expect(result).toEqual([]);
    expect(mockStorage.searchServices).toHaveBeenCalledWith('cut & style');
  });
});
