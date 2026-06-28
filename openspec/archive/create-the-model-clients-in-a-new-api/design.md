# Design: Create the Clients Model in a New API

## Technical Approach

Bootstrap a full Node.js + Express + Prisma backend using Clean Architecture with DDD bounded contexts. Deliver the `clients` bounded context end-to-end (domain → application → infrastructure → interface) and the shared foundations (`api/shared/`, `api/observability/`, Docker Compose). TDD order is strictly inward-to-outward: domain → application (mocked) → infrastructure (integration) → interface (supertest).

---

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| ORM | Prisma | TypeORM, Knex, raw SQL | Schema-first, type-safe, FULLTEXT preview support, single migration model |
| Logger | pino | winston, console | JSON structured output, zero deps, high throughput |
| Validation | Manual in use case + DTO | zod, class-validator | No framework bleed into domain; keeps use cases pure |
| FTS implementation | `$queryRaw` tagged template | Prisma `fullTextSearch` search API | Preview API still limited on boolean mode; raw gives full BOOLEAN MODE control with parameterized binding |
| HTTP framework | Express 4 | Fastify, Hapi | Spec-mandated; simpler to wire without framework magic |
| Error mapping | Controller catch block | Express error middleware | Keeps each controller's error surface explicit and easy to test with supertest |
| Status field | `Int @db.TinyInt` + TS union `0 \| 1` | Boolean, enum string | Matches domain model spec (TINYINT); avoids Prisma enum migration complexity |

---

## Data Flow

### CRUD use cases (create / get / list / update / soft-delete)

```
HTTP Request
    │
    ▼
ClientRouter (interface/clientRouter.ts)
    │  parse & validate id (positive int)
    │  build DTO from body
    ▼
ClientController (interface/ClientController.ts)
    │  call use case
    ▼
UseCase (application/CreateClient.ts | GetClient.ts | …)
    │  validate business rules
    │  call IClientRepository method
    ▼
PrismaClientRepository (infrastructure/PrismaClientRepository.ts)
    │  prisma singleton → parameterized query
    ▼
MySQL 8 (clients table)
    │
    ▼ (map Prisma model → Client domain entity)
    ▼ (map Client entity → ClientResponseDto)
HTTP Response (201 | 200 | 204 | 404 | 422 | 500)
```

### Search use case

```
GET /api/v1/clients/search?q=<term>
    │
    ▼
ClientRouter — q param present? → 400 if missing/empty
    ▼
ClientController.search()
    ▼
SearchClientsUseCase.execute({ query })
    │  sanitizeFtsQuery(query)  ← strips + - * " ( )
    │  empty after sanitize? → return []
    ▼
IClientRepository.search(sanitizedQuery)
    ▼
PrismaClientRepository.$queryRaw`
  SELECT … FROM clients
  WHERE MATCH(name, email) AGAINST(${sanitizedQuery} IN BOOLEAN MODE)
    AND deleted_at IS NULL
  LIMIT 50`
    ▼
MySQL FULLTEXT index (name, email)
    ▼
Client[] → ClientResponseDto[] → HTTP 200
```

---

## File & Folder Structure

```
pfmaster/
├── package.json                                       # root deps: express, prisma, pino, vitest, typescript
├── tsconfig.json                                      # strict, @api/ → api/, @/ → src/
├── vitest.config.ts                                   # include api/**/*.test.ts
├── .env.example                                       # DATABASE_URL, PORT, NODE_ENV
├── docker-compose.yml                                 # services: api (3000), db (MySQL 8)
├── docker/
│   └── my.cnf                                         # ft_min_word_len=2, innodb_ft_min_token_size=2
│
├── prisma/
│   └── schema.prisma                                  # Client model, FULLTEXT preview, mysql provider
│
└── api/
    ├── index.ts                                       # Express app, mounts /api/v1 routes, starts server
    │
    ├── observability/
    │   └── logger.ts                                  # pino JSON logger export
    │
    ├── shared/
    │   ├── domain/
    │   │   ├── BaseEntity.ts                          # id, createdAt, updatedAt (shared interface)
    │   │   └── IRepository.ts                         # generic repo interface (optional base)
    │   ├── infrastructure/
    │   │   └── prisma.ts                              # PrismaClient singleton
    │   └── utils/
    │       ├── sanitizeFtsQuery.ts                    # pure function: strips FTS operators
    │       └── sanitizeFtsQuery.test.ts               # unit tests (all 6 operators + combos)
    │
    └── clients/
        ├── domain/
        │   ├── Client.ts                              # Client interface + ClientStatus type
        │   ├── ClientErrors.ts                        # ClientNotFoundError, ClientValidationError
        │   └── IClientRepository.ts                   # repository contract (domain types only)
        │
        ├── application/
        │   ├── CreateClient.ts
        │   ├── CreateClient.test.ts
        │   ├── GetClient.ts
        │   ├── GetClient.test.ts
        │   ├── ListClients.ts
        │   ├── ListClients.test.ts
        │   ├── UpdateClient.ts
        │   ├── UpdateClient.test.ts
        │   ├── SoftDeleteClient.ts
        │   ├── SoftDeleteClient.test.ts
        │   ├── SearchClients.ts
        │   └── SearchClients.test.ts
        │
        ├── infrastructure/
        │   ├── PrismaClientRepository.ts              # implements IClientRepository via prisma singleton
        │   └── PrismaClientRepository.test.ts         # integration tests (real MySQL via Docker)
        │
        └── interface/
            ├── ClientController.ts                    # methods: create, getById, list, update, remove, search
            ├── ClientController.test.ts               # supertest integration tests
            ├── clientRouter.ts                        # Express Router, mounts all 6 routes
            └── dtos/
                ├── CreateClientDto.ts
                ├── UpdateClientDto.ts
                └── ClientResponseDto.ts
```

---

## Type Signatures & Interfaces

### Domain types (`api/clients/domain/`)

```typescript
// Client.ts
export type ClientStatus = 0 | 1;

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  status: ClientStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ClientErrors.ts
export class ClientNotFoundError extends Error {
  constructor(id: number) {
    super(`Client ${id} not found`);
    this.name = 'ClientNotFoundError';
  }
}

export class ClientValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientValidationError';
  }
}

// IClientRepository.ts
export interface IClientRepository {
  create(data: CreateClientInput): Promise<Client>;
  findById(id: number): Promise<Client | null>;
  findAll(page: number, limit: number): Promise<Client[]>;
  update(id: number, data: UpdateClientInput): Promise<Client>;
  softDelete(id: number): Promise<void>;
  search(sanitizedQuery: string): Promise<Client[]>;
}
```

### Application use case types (`api/clients/application/`)

```typescript
// Shared input types (can live in domain or a types file)
export interface CreateClientInput {
  name: string;
  email: string;
  phone: string;
  phone2?: string | null;
  address?: string | null;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  phone2?: string | null;
  address?: string | null;
  status?: ClientStatus;
}

// Each use case class
class CreateClientUseCase {
  constructor(private readonly repository: IClientRepository) {}
  execute(input: CreateClientInput): Promise<Client>;
}

class GetClientUseCase {
  constructor(private readonly repository: IClientRepository) {}
  execute(id: number): Promise<Client>;
}

class ListClientsUseCase {
  constructor(private readonly repository: IClientRepository) {}
  execute(params: { page: number; limit: number }): Promise<Client[]>;
}

class UpdateClientUseCase {
  constructor(private readonly repository: IClientRepository) {}
  execute(id: number, input: UpdateClientInput): Promise<Client>;
}

class SoftDeleteClientUseCase {
  constructor(private readonly repository: IClientRepository) {}
  execute(id: number): Promise<void>;
}

class SearchClientsUseCase {
  constructor(private readonly repository: IClientRepository) {}
  execute(params: { query: string }): Promise<Client[]>;
}
```

### Interface DTOs (`api/clients/interface/dtos/`)

```typescript
// CreateClientDto.ts
export interface CreateClientDto {
  name: string;
  email: string;
  phone: string;
  phone2?: string;
  address?: string;
}

// UpdateClientDto.ts
export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  phone2?: string | null;
  address?: string | null;
  status?: 0 | 1;
}

// ClientResponseDto.ts
export interface ClientResponseDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  status: 0 | 1;
  createdAt: string;    // ISO 8601 UTC
  updatedAt: string;    // ISO 8601 UTC
}
// Note: deletedAt is NEVER included in response DTOs
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Client {
  id        Int       @id @default(autoincrement())
  name      String    @db.VarChar(255)
  email     String    @db.VarChar(255)
  phone     String    @db.VarChar(50)
  phone2    String?   @db.VarChar(50)
  address   String?   @db.VarChar(500)
  status    Int       @db.TinyInt @default(1)   // 0=inactive, 1=active
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@fulltext([name, email])
  @@map("clients")
}
```

> **Note**: No `@relation` or foreign key fields on `Client`. Other models will reference `clients.id` as plain `Int` columns with a comment — no `FOREIGN KEY` constraint.

---

## Error Handling Strategy

| Error type | Source layer | HTTP status | Response body | Log action |
|------------|-------------|-------------|---------------|------------|
| `ClientValidationError` | application | 422 | `{ "error": "<message>" }` | `logger.warn` — path, method, status |
| `ClientNotFoundError` | application | 404 | `{ "error": "Client not found" }` | `logger.warn` — path, method, status, id |
| Non-numeric `:id` | interface (before use case) | 422 | `{ "error": "Invalid id" }` | `logger.warn` |
| Missing `q` param | interface (before use case) | 400 | `{ "error": "Query parameter 'q' is required" }` | `logger.warn` |
| Unexpected `Error` | infrastructure / unknown | 500 | `{ "error": "Internal server error" }` | `logger.error` — message only, NO stack trace in production |
| Stack trace in production | N/A — suppressed | N/A | Stack is logged internally only when `NODE_ENV !== 'production'` | Never in response body |

**Controller catch pattern** (applied uniformly):
```typescript
try {
  // call use case
} catch (err) {
  if (err instanceof ClientNotFoundError) return res.status(404).json({ error: 'Client not found' });
  if (err instanceof ClientValidationError) return res.status(422).json({ error: err.message });
  logger.error({ method: req.method, path: req.path, err: err instanceof Error ? err.message : String(err) }, '500 Internal');
  return res.status(500).json({ error: 'Internal server error' });
}
```

---

## Test Strategy per Layer

### Layer 1: Domain (pure unit — no dependencies)
- **File**: `api/clients/domain/*.test.ts` (if any logic exists) + `api/shared/utils/sanitizeFtsQuery.test.ts`
- **Tool**: Vitest, no mocks needed
- **Coverage**: `sanitizeFtsQuery` — all 6 operators individually, combined, empty, whitespace-only; `ClientErrors` — message and name

### Layer 2: Application (unit — mock `IClientRepository`)
- **File**: `api/clients/application/*.test.ts`
- **Tool**: Vitest + `vi.fn()` mocks implementing `IClientRepository`
- **Coverage**:

| Use case | Happy path | Error paths |
|----------|-----------|-------------|
| CreateClient | creates with status=1, returns entity | empty name → validation error, repo not called |
| GetClient | returns entity | null → not-found, deletedAt set → not-found |
| ListClients | returns array | page=0 → validation, limit=200 → validation |
| UpdateClient | calls update, returns updated | null → not-found, deletedAt set → not-found, repo.update not called |
| SoftDeleteClient | calls softDelete | already deleted → not-found, repo.softDelete not called |
| SearchClients | returns matches | empty query → [], operators-only → [], sanitized before repo |

### Layer 3: Infrastructure (integration — real MySQL via Docker)
- **File**: `api/clients/infrastructure/PrismaClientRepository.test.ts`
- **Tool**: Vitest + running MySQL container (DATABASE_URL from .env.test or env)
- **Coverage**: `findAll` excludes soft-deleted; `softDelete` sets timestamp without deleting row; `search` uses FULLTEXT, excludes deleted, caps at 50; no raw string interpolation

### Layer 4: Interface (integration — HTTP via supertest)
- **File**: `api/clients/interface/ClientController.test.ts`
- **Tool**: Vitest + supertest (no real DB — use-case layer mocked)
- **Coverage**: all 6 routes (POST, GET list, GET id, PUT, DELETE, GET search); status codes 201/200/204/404/422/400/500; no stack trace in 500 body; non-numeric id → 422; PII not logged

---

## PR Slice Plan

The greenfield bootstrap will far exceed 100 lines total. Sliced into 3 reviewable PRs:

### PR 1 — Bootstrap (infra foundation, no business logic)
**Files**:
- `package.json`, `tsconfig.json`, `vitest.config.ts`, `.env.example`
- `docker-compose.yml`, `docker/my.cnf`
- `prisma/schema.prisma` (Client model)
- `api/observability/logger.ts`
- `api/shared/infrastructure/prisma.ts`
- `api/index.ts` (health endpoint only)

**Tests**:
- `api/shared/utils/sanitizeFtsQuery.ts` + `sanitizeFtsQuery.test.ts` (pure utility, no DB)
- Health endpoint smoke test via supertest

**Review focus**: Docker stack config, Prisma schema correctness, logger isolation, singleton pattern.

---

### PR 2 — Domain + Application (zero DB dependency)
**Files**:
- `api/clients/domain/Client.ts`
- `api/clients/domain/ClientErrors.ts`
- `api/clients/domain/IClientRepository.ts`
- `api/clients/application/CreateClient.ts` + test
- `api/clients/application/GetClient.ts` + test
- `api/clients/application/ListClients.ts` + test
- `api/clients/application/UpdateClient.ts` + test
- `api/clients/application/SoftDeleteClient.ts` + test
- `api/clients/application/SearchClients.ts` + test

**Tests**: All application-layer unit tests with mocked repository (Vitest `vi.fn()`).

**Review focus**: Clean Architecture boundary enforcement (no Prisma in domain/application), TDD coverage, error types.

---

### PR 3 — Infrastructure + Interface (completes the vertical slice)
**Files**:
- `api/clients/infrastructure/PrismaClientRepository.ts` + integration test
- `api/clients/interface/dtos/CreateClientDto.ts`
- `api/clients/interface/dtos/UpdateClientDto.ts`
- `api/clients/interface/dtos/ClientResponseDto.ts`
- `api/clients/interface/ClientController.ts` + supertest test
- `api/clients/interface/clientRouter.ts`
- Update `api/index.ts` to mount client routes

**Tests**: Infrastructure integration tests (Docker MySQL required) + supertest HTTP tests.

**Review focus**: FTS parameterized binding, soft-delete correctness, HTTP status codes, OWASP compliance (no stack traces, PII not logged).

---

## Open Questions

- [ ] Should `UpdateClientDto.status` allow changing status to `0` (inactive) via PUT, or should deactivation be a dedicated endpoint? (Current design: allow it via PUT for simplicity.)
- [ ] Integration tests for `PrismaClientRepository` require the Docker DB to be running — should they be gated behind a separate `npm run test:integration` script vs. the default `npm run test`? (Recommended: yes, separate script.)
