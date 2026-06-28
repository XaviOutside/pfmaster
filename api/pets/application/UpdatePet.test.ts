import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePetUseCase } from './UpdatePet';
import { IPetRepository } from '../domain/IPetRepository';
import { Pet, PET_SEX, PET_STATUS } from '../domain/Pet';
import { PetNotFoundError, PetValidationError } from '../domain/PetErrors';

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

const updatedPet: Pet = {
  ...activePet,
  name: 'Bella Updated',
  breed: 'Toy Poodle',
  updatedAt: new Date('2026-06-28T00:00:00Z'),
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
    clientExistsAndIsActive: vi.fn().mockResolvedValue(true),
    deactivateAllByClientId: vi.fn(),
    softDeleteAllByClientId: vi.fn(),
  };
}

describe('UpdatePetUseCase', () => {
  let repository: IPetRepository;
  let useCase: UpdatePetUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new UpdatePetUseCase(repository);
  });

  it('updates and returns the modified pet', async () => {
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(repository.update).mockResolvedValue(updatedPet);

    const result = await useCase.execute(7, { name: 'Bella Updated', breed: 'Toy Poodle' });

    expect(result).toEqual(updatedPet);
    expect(repository.findById).toHaveBeenCalledWith(7);
    expect(repository.update).toHaveBeenCalledWith(7, {
      name: 'Bella Updated',
      breed: 'Toy Poodle',
    });
  });

  it('throws PetNotFoundError when pet does not exist (null)', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(useCase.execute(99, { name: 'Ghost' })).rejects.toThrow(PetNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws PetNotFoundError when pet is soft-deleted', async () => {
    vi.mocked(repository.findById).mockResolvedValue(deletedPet);

    await expect(useCase.execute(8, { name: 'Ghost' })).rejects.toThrow(PetNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does NOT pass status field through the update input', async () => {
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(repository.update).mockResolvedValue(activePet);

    await useCase.execute(7, { name: 'Bella', status: PET_STATUS.INACTIVE } as any);

    const updateCall = vi.mocked(repository.update).mock.calls[0][1];
    expect(updateCall).not.toHaveProperty('status');
  });

  it('throws PetValidationError when client_id references an inactive client', async () => {
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(repository.clientExistsAndIsActive).mockResolvedValue(false);

    await expect(
      useCase.execute(7, { client_id: 99 }),
    ).rejects.toThrow(PetValidationError);

    await expect(
      useCase.execute(7, { client_id: 99 }),
    ).rejects.toThrow('client_id is not an active client');

    expect(repository.clientExistsAndIsActive).toHaveBeenCalledWith(99);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('validates client_id when provided and client is active', async () => {
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(repository.update).mockResolvedValue(updatedPet);
    vi.mocked(repository.clientExistsAndIsActive).mockResolvedValue(true);

    await useCase.execute(7, { client_id: 99 });

    expect(repository.clientExistsAndIsActive).toHaveBeenCalledWith(99);
    expect(repository.update).toHaveBeenCalledWith(7, { client_id: 99 });
  });

  it('does NOT call clientExistsAndIsActive when client_id is not provided', async () => {
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(repository.update).mockResolvedValue(updatedPet);

    await useCase.execute(7, { name: 'Bella Updated' });

    expect(repository.clientExistsAndIsActive).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalled();
  });

  it('passes only allowed fields to repository.update', async () => {
    vi.mocked(repository.findById).mockResolvedValue(activePet);
    vi.mocked(repository.update).mockResolvedValue(updatedPet);
    vi.mocked(repository.clientExistsAndIsActive).mockResolvedValue(true);

    await useCase.execute(7, {
      name: 'New Name',
      species: 'Cat',
      breed: 'Siamese',
      sex: PET_SEX.MALE,
      dateOfBirth: new Date('2021-03-15T00:00:00Z'),
      weightKg: 4.5,
      notes: 'Indoor cat',
      client_id: 55,
    });

    expect(repository.update).toHaveBeenCalledWith(7, {
      name: 'New Name',
      species: 'Cat',
      breed: 'Siamese',
      sex: PET_SEX.MALE,
      dateOfBirth: new Date('2021-03-15T00:00:00Z'),
      weightKg: 4.5,
      notes: 'Indoor cat',
      client_id: 55,
    });
  });
});
