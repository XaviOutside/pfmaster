import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { logger } from './observability/logger';
import { PrismaClientRepository } from './clients/infrastructure/PrismaClientRepository';
import { CreateClientUseCase } from './clients/application/CreateClient';
import { GetClientUseCase } from './clients/application/GetClient';
import { ListClientsUseCase } from './clients/application/ListClients';
import { UpdateClientUseCase } from './clients/application/UpdateClient';
import { DeactivateClientUseCase } from './clients/application/DeactivateClient';
import { SoftDeleteClientUseCase } from './clients/application/SoftDeleteClient';
import { SearchClientsUseCase } from './clients/application/SearchClients';
import { ClientController } from './clients/interface/ClientController';
import { createClientRouter } from './clients/interface/clientRouter';

// Validate required environment variables at startup (skip in test environment)
if (process.env['NODE_ENV'] !== 'test' && !process.env['DATABASE_URL']) {
  logger.error('DATABASE_URL environment variable is required but not set');
  process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'incoming request');
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Clients bounded context — wire dependencies
const clientRepository = new PrismaClientRepository();
const clientController = new ClientController(
  new CreateClientUseCase(clientRepository),
  new GetClientUseCase(clientRepository),
  new ListClientsUseCase(clientRepository),
  new UpdateClientUseCase(clientRepository),
  new DeactivateClientUseCase(clientRepository),
  new SoftDeleteClientUseCase(clientRepository),
  new SearchClientsUseCase(clientRepository),
);
app.use('/api/v1/clients', createClientRouter(clientController));

// 404 handler — must be last route
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

export { app };

// Start server only when not in test environment
if (process.env['NODE_ENV'] !== 'test') {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  app.listen(port, () => {
    logger.info({ port }, `API server listening`);
  });
}
