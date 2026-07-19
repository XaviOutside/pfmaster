import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchClientsUseCase } from './SearchClients';
import { IClientRepository } from '../domain/IClientRepository';
import { Client, CLIENT_STATUS } from '../domain/Client';

const matchingClient: Client = {
  id: 1,
  name: 'Bob Builder',
  email: 'bob@example.com',
  phone: '555-0400',
  phone2: null,
  address: null,
  status: CLIENT_STATUS.ACTIVE,
  lastServiceDate: null,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

function makeRepository(): IClientRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    existsById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
  };
}

describe('SearchClientsUseCase', () => {
  let repository: IClientRepository;
  let useCase: SearchClientsUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new SearchClientsUseCase(repository);
  });

  describe('valid query delegation', () => {
    it('delegates to repository.search() with sanitized query', async () => {
      vi.mocked(repository.search).mockResolvedValue([matchingClient]);

      const result = await useCase.execute({ query: 'bob' });

      expect(result).toEqual([matchingClient]);
      expect(repository.search).toHaveBeenCalledWith('bob');
    });

    it('strips stopwords before delegating to repository', async () => {
      vi.mocked(repository.search).mockResolvedValue([]);

      await useCase.execute({ query: 'Calle de la Paz' });

      // "de" and "la" are stopwords — stripped by sanitizeFtsQuery
      const callArg = vi.mocked(repository.search).mock.calls[0][0];
      expect(callArg).toBe('calle paz');
    });
  });

  describe('3-char gate', () => {
    it('returns empty array and does NOT call repository when query < 3 chars after trim', async () => {
      const result = await useCase.execute({ query: 'ab' });

      expect(result).toEqual([]);
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('returns empty array for single character query', async () => {
      const result = await useCase.execute({ query: 'a' });

      expect(result).toEqual([]);
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('returns empty array for empty string', async () => {
      const result = await useCase.execute({ query: '' });

      expect(result).toEqual([]);
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('returns empty array for whitespace-only query', async () => {
      const result = await useCase.execute({ query: '   ' });

      expect(result).toEqual([]);
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('trims before checking length — "  ab  " → empty', async () => {
      const result = await useCase.execute({ query: '  ab  ' });

      expect(result).toEqual([]);
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('allows query ≥ 3 chars after trim and delegates to repository', async () => {
      vi.mocked(repository.search).mockResolvedValue([matchingClient]);

      const result = await useCase.execute({ query: 'abc' });

      expect(result).toEqual([matchingClient]);
      expect(repository.search).toHaveBeenCalledWith('abc');
    });
  });

  describe('all-stopword → empty', () => {
    it('returns empty when sanitized query is all stopwords ("de la")', async () => {
      const result = await useCase.execute({ query: 'de la' });

      expect(result).toEqual([]);
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('returns empty when sanitized query is all stopwords ("the of in")', async () => {
      const result = await useCase.execute({ query: 'the of in' });

      expect(result).toEqual([]);
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('returns empty when single stopword is passed ("de")', async () => {
      const result = await useCase.execute({ query: 'de' });

      expect(result).toEqual([]);
      expect(repository.search).not.toHaveBeenCalled();
    });
  });

  describe('SANE rejection', () => {
    it('throws SANE_ERROR when query contains FTS operator "', async () => {
      await expect(useCase.execute({ query: 'bob"' })).rejects.toThrow('SANE_ERROR');
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('throws SANE_ERROR when query contains +', async () => {
      await expect(useCase.execute({ query: '+bob -builder' })).rejects.toThrow('SANE_ERROR');
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('throws SANE_ERROR when query contains *', async () => {
      await expect(useCase.execute({ query: 'bob*' })).rejects.toThrow('SANE_ERROR');
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('throws SANE_ERROR when query contains (', async () => {
      await expect(useCase.execute({ query: 'bob(builder' })).rejects.toThrow('SANE_ERROR');
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('throws SANE_ERROR when query contains )', async () => {
      await expect(useCase.execute({ query: 'bob)builder' })).rejects.toThrow('SANE_ERROR');
      expect(repository.search).not.toHaveBeenCalled();
    });

    it('throws SANE_ERROR when query contains -', async () => {
      await expect(useCase.execute({ query: 'bob-builder' })).rejects.toThrow('SANE_ERROR');
      expect(repository.search).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('passes through a valid query with accents to repository', async () => {
      vi.mocked(repository.search).mockResolvedValue([]);

      await useCase.execute({ query: 'Peña' });

      expect(repository.search).toHaveBeenCalledWith('peña');
    });

    it('returns empty array from repository when no matches', async () => {
      vi.mocked(repository.search).mockResolvedValue([]);

      const result = await useCase.execute({ query: 'xyz' });

      expect(result).toEqual([]);
    });
  });
});
