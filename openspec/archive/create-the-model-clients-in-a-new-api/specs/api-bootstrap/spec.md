# api-bootstrap Specification

## Purpose

Defines the requirements for bootstrapping the Express API server, Prisma database connection, structured logging, and Docker Compose development environment. This capability is the runtime foundation every other bounded context depends on.

## Out of Scope

- Frontend (React/Vite/src/) — separate change
- Authentication middleware — deferred
- SonarQube/Snyk CI pipeline — deferred to CI setup change
- Pets, Services, Appointments bounded contexts

---

## Requirements

### Requirement: Project Configuration Files

The project MUST include a root `package.json` with TypeScript, Express, Prisma, Vitest, and pino as declared dependencies. A `tsconfig.json` MUST enable strict mode and define path aliases `@/` → `src/` and `@api/` → `api/`. A `vitest.config.ts` MUST configure the test runner for the `api/` directory.

#### Scenario: TypeScript compilation succeeds with strict mode

- GIVEN the repository has `tsconfig.json` with `"strict": true`
- WHEN `tsc --noEmit` is executed at repo root
- THEN the command exits with code 0 and emits no type errors

#### Scenario: Path alias resolves in test files

- GIVEN `vitest.config.ts` declares alias `@api/` → `api/`
- WHEN a test file imports `import { logger } from '@api/observability/logger'`
- THEN Vitest resolves the module without a "Cannot find module" error

#### Scenario: Missing required dependency fails install

- GIVEN `package.json` does not list `express` as a dependency
- WHEN `npm install` runs and a route file imports express
- THEN TypeScript or the runtime throws a module-not-found error

---

### Requirement: Docker Compose Stack

The repository MUST include a `docker-compose.yml` at the root defining two services: `api` (Node.js, port 3000) and `db` (MySQL 8). The `db` service MUST mount `docker/my.cnf` as its MySQL configuration file. A `.env.example` MUST document all required environment variables: `DATABASE_URL`, `PORT`, and `NODE_ENV`.

#### Scenario: Stack starts successfully

- GIVEN Docker Desktop is running and `.env` is populated from `.env.example`
- WHEN `docker compose up -d` is executed
- THEN both `api` and `db` containers reach status `running` without errors

#### Scenario: ft_min_word_len is set to 2

- GIVEN `docker/my.cnf` contains `ft_min_word_len = 2`
- WHEN the `db` container starts and a query `SHOW VARIABLES LIKE 'ft_min_word_len'` is executed
- THEN the result row shows `Value = 2`

#### Scenario: Missing .env prevents API startup

- GIVEN `DATABASE_URL` is absent from the environment
- WHEN the `api` container starts
- THEN the process exits with a non-zero code and logs an error indicating missing configuration

---

### Requirement: Express Application Bootstrap

`api/index.ts` MUST create an Express application, mount all route modules under `/api/v1`, and start listening on the port defined by `PORT` env variable. The server MUST respond to `GET /health` with HTTP 200 and `{ "status": "ok" }`.

#### Scenario: Health check endpoint responds

- GIVEN the API server is running on port 3000
- WHEN `GET /api/v1/health` is requested
- THEN the response status is 200 and body is `{ "status": "ok" }`

#### Scenario: Unknown route returns 404

- GIVEN the API server is running
- WHEN `GET /api/v1/nonexistent` is requested
- THEN the response status is 404

---

### Requirement: Structured Logger

`api/observability/logger.ts` MUST export a pino logger instance configured to emit JSON-structured logs. The logger MUST NOT be imported in `domain/` or `application/` layers — only in `interface/` and `infrastructure/`.

#### Scenario: Logger emits JSON to stdout

- GIVEN the pino logger is configured with `{ level: 'info' }`
- WHEN `logger.info({ event: 'server_started' }, 'API ready')` is called
- THEN a JSON line with `level`, `msg`, and `event` fields is written to stdout

#### Scenario: Logger layer boundary is respected

- GIVEN a use case file in `api/clients/application/`
- WHEN that file is statically analyzed
- THEN it contains zero imports from `@api/observability/logger`

---

### Requirement: Prisma Singleton

`api/shared/infrastructure/prisma.ts` MUST export a single `PrismaClient` instance. The Prisma schema MUST use the `mysql` provider and enable `previewFeatures = ["fullTextSearch", "fullTextIndex"]`. All `infrastructure/` repositories MUST import the singleton — never instantiate `PrismaClient` directly.

#### Scenario: Single PrismaClient instance across imports

- GIVEN two repository files import `prisma` from `api/shared/infrastructure/prisma`
- WHEN both are loaded in the same Node process
- THEN both reference the same `PrismaClient` instance (referential equality)

#### Scenario: Prisma generates client without errors

- GIVEN `prisma/schema.prisma` has `previewFeatures = ["fullTextSearch", "fullTextIndex"]`
- WHEN `npx prisma generate` is executed
- THEN the command exits with code 0 and the generated client includes FULLTEXT support
