import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateServiceUseCase } from './CreateService';
import { IServiceRepository } from '../domain/IServiceRepository';
import { Service, SERVICE_STATUS, CreateServiceInput } from '../domain/Service';
import { ValidationError } from '@api/shared/domain/errors';

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

function makeRepository(): IServiceRepository {
  return {
    create: vi.fn().mockResolvedValue(mockService),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
  };
}

describe('CreateServiceUseCase', () => {
  let repository: IServiceRepository;
  let useCase: CreateServiceUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new CreateServiceUseCase(repository);
  });

  it('creates and returns a service when all validations pass', async () => {
    const input: CreateServiceInput = {
      name: 'Full Groom',
      description: 'Complete grooming',
      durationMinutes: 60,
      price: 5000,
    };

    const result = await useCase.execute(input);

    expect(result).toEqual(mockService);
    expect(result.status).toBe(SERVICE_STATUS.ACTIVE);
    expect(repository.create).toHaveBeenCalledOnce();
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  it('throws ValidationError when name is empty', async () => {
    await expect(
      useCase.execute({ name: '', price: 1000 }),
    ).rejects.toThrow(ValidationError);

    await expect(
      useCase.execute({ name: '', price: 1000 }),
    ).rejects.toThrow('Name is required');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ValidationError when name is whitespace only', async () => {
    await expect(
      useCase.execute({ name: '   ', price: 1000 }),
    ).rejects.toThrow(ValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ValidationError when name exceeds 255 characters', async () => {
    const longName = 'A'.repeat(256);

    await expect(
      useCase.execute({ name: longName, price: 1000 }),
    ).rejects.toThrow(ValidationError);

    await expect(
      useCase.execute({ name: longName, price: 1000 }),
    ).rejects.toThrow('Name must be 255 characters or fewer');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('allows name at exactly 255 characters', async () => {
    const name = 'A'.repeat(255);

    await useCase.execute({ name, price: 1000 });

    expect(repository.create).toHaveBeenCalledOnce();
  });

  it('throws ValidationError when price is negative', async () => {
    await expect(
      useCase.execute({ name: 'Test', price: -1 }),
    ).rejects.toThrow(ValidationError);

    await expect(
      useCase.execute({ name: 'Test', price: -1 }),
    ).rejects.toThrow('Price must be a non-negative integer');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('allows price of 0 (free service)', async () => {
    await useCase.execute({ name: 'Free Consultation', price: 0 });
    expect(repository.create).toHaveBeenCalledOnce();
  });

  it('throws ValidationError when durationMinutes is negative', async () => {
    await expect(
      useCase.execute({ name: 'Test', price: 1000, durationMinutes: -10 }),
    ).rejects.toThrow(ValidationError);

    await expect(
      useCase.execute({ name: 'Test', price: 1000, durationMinutes: -10 }),
    ).rejects.toThrow('Duration must be a positive integer');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws ValidationError when durationMinutes is 0', async () => {
    await expect(
      useCase.execute({ name: 'Test', price: 1000, durationMinutes: 0 }),
    ).rejects.toThrow(ValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('allows durationMinutes to be undefined (optional)', async () => {
    await useCase.execute({ name: 'Bath', price: 2500 });
    expect(repository.create).toHaveBeenCalledOnce();
  });
});
