import { Router } from 'express';
import type { Request, Response } from 'express';
import { PetController } from './PetController';

/**
 * Creates an Express Router for the pets bounded context.
 * Routes are bound to a pre-constructed PetController instance,
 * enabling dependency injection and making the router testable.
 *
 * Route order matters:
 *   GET /search MUST be declared before GET /:id to avoid "search" being
 *   interpreted as an :id parameter.
 */
export function createPetRouter(controller: PetController): Router {
  const router = Router();

  // POST   /api/v1/pets
  router.post('/', (req: Request, res: Response) =>
    controller.createPet(req, res),
  );

  // GET    /api/v1/pets/search  — MUST be declared before /:id
  router.get('/search', (req: Request, res: Response) =>
    controller.searchPets(req, res),
  );

  // GET    /api/v1/pets
  router.get('/', (req: Request, res: Response) =>
    controller.listPets(req, res),
  );

  // GET    /api/v1/pets/:id
  router.get('/:id', (req: Request, res: Response) =>
    controller.getPet(req, res),
  );

  // PUT    /api/v1/pets/:id
  router.put('/:id', (req: Request, res: Response) =>
    controller.updatePet(req, res),
  );

  // PATCH  /api/v1/pets/:id/deactivate
  router.patch('/:id/deactivate', (req: Request, res: Response) =>
    controller.deactivatePet(req, res),
  );

  // DELETE /api/v1/pets/:id
  router.delete('/:id', (req: Request, res: Response) =>
    controller.deletePet(req, res),
  );

  return router;
}
