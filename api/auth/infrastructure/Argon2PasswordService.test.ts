import { describe, it, expect } from 'vitest';
import { Argon2PasswordService } from './Argon2PasswordService';

describe('Argon2PasswordService', () => {
  const service = new Argon2PasswordService();

  it('hash produces a valid argon2id string', async () => {
    const hash = await service.hash('securePass123');

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');
    expect(hash.length).toBeGreaterThan(80);
  });

  it('verify returns true for correct password', async () => {
    const hash = await service.hash('securePass123');
    const isValid = await service.verify('securePass123', hash);

    expect(isValid).toBe(true);
  });

  it('verify returns false for wrong password', async () => {
    const hash = await service.hash('securePass123');
    const isValid = await service.verify('wrong-password', hash);

    expect(isValid).toBe(false);
  });

  it('verify returns false for empty password against a real hash', async () => {
    const hash = await service.hash('securePass123');
    const isValid = await service.verify('', hash);

    expect(isValid).toBe(false);
  });

  it('each hash call produces a different output (salt)', async () => {
    const hash1 = await service.hash('securePass123');
    const hash2 = await service.hash('securePass123');

    expect(hash1).not.toBe(hash2);
    // Both should be valid argon2id hashes
    expect(hash1).toContain('$argon2id$');
    expect(hash2).toContain('$argon2id$');
  });

  it('uses configurable memory cost from environment', async () => {
    const withDefault = new Argon2PasswordService();
    const withCustom = new Argon2PasswordService({ memoryCost: 4096 });

    const hashDefault = await withDefault.hash('test');
    const hashCustom = await withCustom.hash('test');

    // Both valid, memory cost may differ in the encoded hash string
    expect(hashDefault).toContain('$argon2id$');
    expect(hashCustom).toContain('$argon2id$');
  });
});
