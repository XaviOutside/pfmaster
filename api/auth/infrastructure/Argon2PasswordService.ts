import * as argon2 from 'argon2';
import { IPasswordService } from '../domain/IPasswordService';

export interface Argon2Config {
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
}

const DEFAULT_MEMORY_COST = 65536;
const DEFAULT_TIME_COST = 3;
const DEFAULT_PARALLELISM = 4;

function readEnvInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export class Argon2PasswordService implements IPasswordService {
  private readonly config: Required<Argon2Config>;

  constructor(config?: Argon2Config) {
    this.config = {
      memoryCost:
        config?.memoryCost ?? readEnvInt('ARGON2_MEMORY_COST', DEFAULT_MEMORY_COST),
      timeCost:
        config?.timeCost ?? readEnvInt('ARGON2_TIME_COST', DEFAULT_TIME_COST),
      parallelism:
        config?.parallelism ?? readEnvInt('ARGON2_PARALLELISM', DEFAULT_PARALLELISM),
    };
  }

  async hash(plaintext: string): Promise<string> {
    return argon2.hash(plaintext, {
      type: argon2.argon2id,
      hashLength: 32,
      memoryCost: this.config.memoryCost,
      timeCost: this.config.timeCost,
      parallelism: this.config.parallelism,
    });
  }

  async verify(plaintext: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plaintext);
    } catch {
      return false;
    }
  }
}
