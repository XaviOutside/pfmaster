import { Router } from 'express';
import type { Request, Response } from 'express';
import { AuthController } from './AuthController';

/**
 * Creates an Express Router for the auth bounded context.
 * Routes are bound to a pre-constructed AuthController instance,
 * enabling dependency injection and making the router testable.
 *
 * Routes:
 *   POST /login   — authenticate user, return session token
 *   POST /logout  — invalidate session
 */
export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  // POST /api/v1/auth/login
  router.post('/login', (req: Request, res: Response) =>
    controller.login(req, res),
  );

  // POST /api/v1/auth/logout
  router.post('/logout', (req: Request, res: Response) =>
    controller.logout(req, res),
  );

  return router;
}
