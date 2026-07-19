import { Router } from 'express';
import type { Request, Response } from 'express';
import { AppointmentController } from './AppointmentController';

/**
 * Creates an Express Router for the appointments bounded context.
 * Routes are bound to a pre-constructed AppointmentController instance,
 * enabling dependency injection and making the router testable.
 *
 * Routes:
 *   POST   /     → create
 *   GET    /     → listWeek (query: start, end)
 *   GET    /:id  → getById
 *   PATCH  /:id  → update
 *   DELETE /:id  → cancel
 */
export function createAppointmentRouter(controller: AppointmentController): Router {
  const router = Router();

  // POST   /api/v1/appointments
  router.post('/', (req: Request, res: Response) =>
    controller.create(req, res),
  );

  // GET    /api/v1/appointments?start=&end=
  router.get('/', (req: Request, res: Response) =>
    controller.listWeek(req, res),
  );

  // GET    /api/v1/appointments/:id
  router.get('/:id', (req: Request, res: Response) =>
    controller.getById(req, res),
  );

  // PATCH  /api/v1/appointments/:id
  router.patch('/:id', (req: Request, res: Response) =>
    controller.update(req, res),
  );

  // DELETE /api/v1/appointments/:id
  router.delete('/:id', (req: Request, res: Response) =>
    controller.cancel(req, res),
  );

  return router;
}
