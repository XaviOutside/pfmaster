import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutUseCase } from './LogoutUseCase';
import { IAuthRepository } from '../domain/IAuthRepository';

function makeRepository(overrides?: Partial<IAuthRepository>): IAuthRepository {
  return {
    findUserByEmail: vi.fn().mockResolvedValue(null),
    createSession: vi.fn().mockResolvedValue(null as never),
    findValidSession: vi.fn().mockResolvedValue(null),
    invalidateSession: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('LogoutUseCase', () => {
  let repository: IAuthRepository;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new LogoutUseCase(repository);
  });

  it('soft-deletes the session for a valid token', async () => {
    await useCase.execute('550e8400-e29b-41d4-a716-446655440000');

    expect(repository.invalidateSession).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    expect(repository.invalidateSession).toHaveBeenCalledOnce();
  });

  it('is idempotent when session is already invalidated', async () => {
    // First call
    await useCase.execute('550e8400-e29b-41d4-a716-446655440000');

    // Second call with same token — should not throw
    await expect(
      useCase.execute('550e8400-e29b-41d4-a716-446655440000'),
    ).resolves.toBeUndefined();

    expect(repository.invalidateSession).toHaveBeenCalledTimes(2);
  });

  it('does not throw when an empty token is provided', async () => {
    await expect(
      useCase.execute(''),
    ).resolves.toBeUndefined();

    expect(repository.invalidateSession).toHaveBeenCalledWith('');
  });
});
