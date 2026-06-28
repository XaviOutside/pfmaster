import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeactivateServiceUseCase } from './DeactivateService';
import { IServiceRepository } from '../domain/IServiceRepository';
import { Service, SERVICE_STATUS } from '../domain/Service';
import { NotFoundError } from '@api/shared/domain/errors';

const activeService: Service = {
  id: 1,
  name: 'Full Groom',
  description: null,
  durationMinutes: 60,
  price: 5000,
  petId: null,
  status: SERVICE_STATUS.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

function makeRepository(overrides?: Partial<IServiceRepository>): IServiceRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(activeService),
    findAll: vi.fn(),
    update: vi.fn().mockResolvedValue({ ...activeService, status: SERVICE_STATUS.INACTIVE }),
    softDelete: vi.fn(),
    search: vi.fn(),
    unlinkAllByPetId: vi.fn(),
    ...overrides,
  };
}

describe('DeactivateServiceUseCase', () => {
  let repository: IServiceRepository;
  let useCase: DeactivateServiceUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new DeactivateServiceUseCase(repository);
  });

  it('deactivates an active service', async () => {
    const result = await useCase.execute(1);

    expect(result.status).toBe(SERVICE_STATUS.INACTIVE);
    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(repository.update).toHaveBeenCalledWith(1, { status: SERVICE_STATUS.INACTIVE });
  });

  it('throws NotFoundError when service does not exist', async () => {
    const repo = makeRepository({ findById: vi.fn().mockResolvedValue(null) });
    const uc = new DeactivateServiceUseCase(repo);

    await expect(uc.execute(999)).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when service is soft-deleted', async () => {
    const deleted = { ...activeService, deletedAt: new Date() };
    const repo = makeRepository({ findById: vi.fn().mockResolvedValue(deleted) });
    const uc = new DeactivateServiceUseCase(repo);

    await expect(uc.execute(1)).rejects.toThrow(NotFoundError);
  });

  it('is idempotent — deactivating an already inactive service returns 200', async () => {
    const inactive = { ...activeService, status: SERVICE_STATUS.INACTIVE };
    const repo = makeRepository({
      findById: vi.fn().mockResolvedValue(inactive),
      update: vi.fn().mockResolvedValue(inactive),
    });
    const uc = new DeactivateServiceUseCase(repo);

    const result = await uc.execute(1);

    expect(result.status).toBe(SERVICE_STATUS.INACTIVE);
    // Still calls update (idempotent)
    expect(repo.update).toHaveBeenCalledWith(1, { status: SERVICE_STATUS.INACTIVE });
  });
});
