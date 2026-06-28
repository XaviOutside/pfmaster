import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeactivatePetUseCase } from './DeactivatePet';
import { IPetRepository } from '../domain/IPetRepository';
import { Pet, PET_SEX, PET_STATUS } from '../domain/Pet';
import { PetNotFoundError } from '../domain/PetErrors';

const activePet: Pet = {
  id: 7,
  client_id: 42,
  name: 'Bella',
  species: 'Dog',
  breed: 'Poodle',
  sex: PET_SEX.FEMALE,
  dateOfBirth: new Date('2022-05-10T00:00:00Z'),
  weightKg: 8.2,
  notes: null,
  status: PET_STATUS.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

const deletedPet: Pet = {
  ...activePet,
  id: 8,
  deletedAt: new Date('2026-06-01T00:00:00Z'),
};

function makeRepository(): IPetRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAllByClientId: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
    clientExistsAndIsActive: vi.fn(),
    deactivateAllByClientId: vi.fn(),
    softDeleteAllByClientId: vi.fn(),
  };
}

describe('DeactivatePetUseCase', () => {
  let repository: IPetRepository;
  let useCase: DeactivatePetUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new DeactivatePetUseCase(repository);
  });

  it('sets status to INACTIVE (0) and calls repository.update', async () => {
    const inactivePet: Pet = { ...activePet, status: PET_STATUS.INACTIVE };
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(repository.update).mockResolvedValue(inactivePet);

    const result = await useCase.execute(7);

    expect(result.status).toBe(PET_STATUS.INACTIVE);
    expect(repository.findById).toHaveBeenCalledWith(7);
    expect(repository.update).toHaveBeenCalledWith(7, { status: PET_STATUS.INACTIVE });
  });

  it('throws PetNotFoundError when pet does not exist (null)', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toThrow(PetNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws PetNotFoundError when pet is soft-deleted', async () => {
    vi.mocked(repository.findById).mockResolvedValue(deletedPet);

    await expect(useCase.execute(8)).rejects.toThrow(PetNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
