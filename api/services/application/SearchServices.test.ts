import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchServicesUseCase } from './SearchServices';
import { IServiceRepository } from '../domain/IServiceRepository';
import { Service, SERVICE_STATUS } from '../domain/Service';

const makeService = (id: number, name: string): Service => ({
  id,
  name,
  description: null,
  durationMinutes: null,
  price: 1000,
  petId: null,
  status: SERVICE_STATUS.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

function makeRepository(overrides?: Partial<IServiceRepository>): IServiceRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn().mockResolvedValue([makeService(1, 'Nail Trim')]),
    unlinkAllByPetId: vi.fn(),
    ...overrides,
  };
}

describe('SearchServicesUseCase', () => {
  let repository: IServiceRepository;
  let useCase: SearchServicesUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new SearchServicesUseCase(repository);
  });

  it('returns matching services for a valid query', async () => {
    const results = await useCase.execute({ query: 'nail' });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Nail Trim');
    expect(repository.search).toHaveBeenCalledWith('nail');
  });

  it('normalizes query through sanitizeFtsQuery before passing to repository', async () => {
    await useCase.execute({ query: '  Haircut   Bath  ' });

    // Whitespace normalized: "  Haircut   Bath  " → "haircut bath"
    expect(repository.search).toHaveBeenCalledWith('haircut bath');
  });

  it('returns empty array when query is only stopwords', async () => {
    const results = await useCase.execute({ query: 'de la' });

    expect(results).toEqual([]);
    expect(repository.search).not.toHaveBeenCalled();
  });

  it('returns empty array when repository returns no matches', async () => {
    const repo = makeRepository({ search: vi.fn().mockResolvedValue([]) });
    const uc = new SearchServicesUseCase(repo);

    const results = await uc.execute({ query: 'nonexistent' });
    expect(results).toEqual([]);
  });
});
