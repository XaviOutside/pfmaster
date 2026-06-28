import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetServiceUseCase } from './GetService';
import { IServiceRepository } from '../domain/IServiceRepository';
import { Service, SERVICE_STATUS } from '../domain/Service';
import { NotFoundError } from '@api/shared/domain/errors';

const mockService: Service = {
  id: 1,
  name: 'Full Groom',
  description: 'Complete grooming',
  durationMinutes: 60,
  price: 5000,
  status: SERVICE_STATUS.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

function makeRepository(overrides?: Partial<IServiceRepository>): IServiceRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockService),
    findAll: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
    ...overrides,
  };
}

describe('GetServiceUseCase', () => {
  let repository: IServiceRepository;
  let useCase: GetServiceUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new GetServiceUseCase(repository);
  });

  it('returns the service when found and not deleted', async () => {
    const result = await useCase.execute(1);
    expect(result).toEqual(mockService);
    expect(repository.findById).toHaveBeenCalledWith(1);
  });

  it('throws NotFoundError when service does not exist', async () => {
    const repo = makeRepository({ findById: vi.fn().mockResolvedValue(null) });
    const uc = new GetServiceUseCase(repo);

    await expect(uc.execute(999)).rejects.toThrow(NotFoundError);
    await expect(uc.execute(999)).rejects.toThrow('Service with id 999 not found');
  });

  it('throws NotFoundError when service is soft-deleted', async () => {
    const deletedService: Service = { ...mockService, deletedAt: new Date() };
    const repo = makeRepository({ findById: vi.fn().mockResolvedValue(deletedService) });
    const uc = new GetServiceUseCase(repo);

    await expect(uc.execute(1)).rejects.toThrow(NotFoundError);
    await expect(uc.execute(1)).rejects.toThrow('Service with id 1 not found');
  });
});
