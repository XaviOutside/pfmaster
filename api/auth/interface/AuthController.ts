import type { Request, Response } from 'express';
import { logger } from '@api/observability/logger';
import { LoginUseCase } from '../application/LoginUseCase';
import { LogoutUseCase } from '../application/LogoutUseCase';
import { InvalidCredentialsError } from '../domain/AuthErrors';
import { toLoginResponseDto } from './dtos/LoginResponseDto';
import type { LoginRequestDto } from './dtos/LoginRequestDto';

/**
 * Maps domain errors to HTTP status codes and response bodies.
 * - InvalidCredentialsError → 401 (uniform message, no enumeration)
 * - All other errors → 500 (no stack trace or PII in body)
 *
 * Validation (422) is handled inline in login() — not through this handler.
 */
function handleError(err: unknown, res: Response): void {
  if (err instanceof InvalidCredentialsError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(401).json({ error: err.message });
    return;
  }

  // Unknown error — log message only, never stack or PII in response
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error({ errorName: err instanceof Error ? err.name : 'UnknownError' }, message);
  res.status(500).json({ error: 'Internal server error' });
}

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as LoginRequestDto;

      if (!body.email || !body.email.trim()) {
        res.status(422).json({ error: 'Email is required' });
        return;
      }

      if (!body.password || body.password.length < 8) {
        res.status(422).json({ error: 'Password must be at least 8 characters' });
        return;
      }

      const result = await this.loginUseCase.execute(body.email, body.password);
      const dto = toLoginResponseDto(
        { token: result.token, userId: result.user.id, role: result.user.role, companyId: result.user.companyId, companyName: result.user.companyName, expiresAt: new Date() },
        result.user.email,
      );

      logger.info({ email: body.email, success: true }, 'Login successful');
      res.status(200).json(dto);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        logger.warn({ email: (req.body as LoginRequestDto)?.email, success: false }, 'Login failed');
      }
      handleError(err, res);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || typeof authHeader !== 'string') {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = extractBearerToken(authHeader);
      if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.logoutUseCase.execute(token);
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  }
}

/**
 * Extracts the token from a Bearer authorization header.
 * Case-insensitive prefix check. Returns null if malformed.
 */
export function extractBearerToken(authHeader: string): string | null {
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return null;
  if (parts[0].toLowerCase() !== 'bearer') return null;

  const token = parts[1].trim();
  if (!token) return null;

  return token;
}
