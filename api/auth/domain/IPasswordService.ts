/**
 * Password service interface — domain layer abstraction over hashing.
 * Domain types only — no argon2, no framework imports.
 */
export interface IPasswordService {
  /** Hash a plaintext password. Returns the encoded hash string. */
  hash(plaintext: string): Promise<string>;

  /** Verify a plaintext password against a stored hash. */
  verify(plaintext: string, hash: string): Promise<boolean>;
}
