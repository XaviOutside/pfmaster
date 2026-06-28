# Exploration: Create the model Clients in a new API

**Date**: 2026-06-24
**Project**: pfmaster
**Change**: Create the model Clients in a new API
**Phase**: explore
**Store**: hybrid (Engram + OpenSpec)

---

## Current State

This is a **greenfield project**. The repository contains only:
- `.gitignore` (GitHub default template for Node.js/JS ecosystem)
- `README.md` (5 lines, no content)
- `AGENTS.md` (full project spec and architecture rules)
- `openspec/` SDD scaffolding (config, init report, testing capabilities)
- No `package.json`, no `prisma/`, no `api/`, no `src/`, no `docker-compose.yml`

The AGENTS.md defines the **full target architecture** — this is a spec-driven greenfield. Everything must be built from scratch following those constraints.

---

## Affected Areas

Since no source code exists, the following paths must be **created** (none exist yet):

| Path | Purpose |
|------|---------|
| `package.json` | Root manifest (or separate `api/package.json`) |
| `tsconfig.json` | TypeScript strict config |
| `docker-compose.yml` | Services: `app`, `api`, `db` (MySQL 8) |
| `docker/my.cnf` | MySQL config (`ft_min_word_len = 2`) |
| `.env.example` | Environment variable documentation |
| `prisma/schema.prisma` | Prisma schema with `Client` model |
| `api/clients/domain/` | Entity, value objects, repository interface |
| `api/clients/application/` | Use cases (CreateClient, GetClient, ListClients, UpdateClient, DeleteClient) |
| `api/clients/interface/` | Express controller, routes, request/response DTOs |
| `api/clients/infrastructure/` | PrismaClientRepository implementation |
| `api/shared/domain/` | Base entity, base repository interface |
| `api/shared/infrastructure/` | DB connection, base repository |
| `api/shared/utils/` | Sanitize, pagination helpers |
| `api/observability/logger.ts` | Structured logger (pino) |
| `api/db/migrations/` | SQL migration files |
| `api/db/seeds/` | Development seed data |

---

## Domain Model (from AGENTS.md spec)

```
Client
  id              INT AUTO_INCREMENT PRIMARY KEY
  name            VARCHAR(255) NOT NULL
  email           VARCHAR(255) NOT NULL UNIQUE
  phone           VARCHAR(50)
  phone2          VARCHAR(50)
  address         TEXT
  status          TINYINT NOT NULL DEFAULT 1  -- 0=inactive, 1=active
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  deleted_at      DATETIME NULL               -- soft delete

FULLTEXT INDEX: FULLTEXT(name, email)
```

**Key constraints** (from AGENTS.md):
- `status` is `TINYINT` (0=inactive, 1=active) — **NOT** an enum string
- **No foreign keys** — referential integrity at application layer
- Prices stored as integers in cents (not applicable to Client, but establishes pattern)
- FTS via `FULLTEXT` index — no `LIKE '%term%'` for user-facing search
- Soft delete via `deleted_at` — clients are never hard-deleted

---

## Architecture Breakdown (Clean Architecture)

```
api/clients/
├── domain/
│   ├── Client.ts                     # Client entity (pure TS class, zero framework imports)
│   ├── ClientStatus.ts               # Union type: 0 | 1 (inactive | active)
│   ├── IClientRepository.ts          # Repository interface (domain-owned)
│   └── ClientErrors.ts               # Domain error types (ClientNotFoundError, etc.)
│
├── application/
│   ├── CreateClientUseCase.ts        # Creates a new client (validates, calls repo)
│   ├── GetClientUseCase.ts           # Finds a client by ID
│   ├── ListClientsUseCase.ts         # Paginated list, with optional FTS search
│   ├── UpdateClientUseCase.ts        # Updates client fields
│   ├── DeactivateClientUseCase.ts    # Sets status=0 (business rule: deactivate, not delete)
│   └── __tests__/                    # Unit tests for each use case (Vitest)
│       ├── CreateClientUseCase.test.ts
│       ├── GetClientUseCase.test.ts
│       ├── ListClientsUseCase.test.ts
│       ├── UpdateClientUseCase.test.ts
│       └── DeactivateClientUseCase.test.ts
│
├── interface/
│   ├── ClientController.ts           # Express request handlers (thin — delegates to use cases)
│   ├── ClientRoutes.ts               # Express Router with route definitions
│   ├── dto/
│   │   ├── CreateClientDto.ts        # Validated request body for POST /clients
│   │   └── UpdateClientDto.ts        # Validated request body for PUT /clients/:id
│   └── __tests__/
│       └── ClientController.test.ts  # Controller unit tests (mock use cases)
│
└── infrastructure/
    ├── PrismaClientRepository.ts     # Implements IClientRepository using Prisma client
    └── __tests__/
        └── PrismaClientRepository.integration.test.ts  # Integration tests (real DB or test DB)
```

---

## Approaches

### Option A — Minimal bootstrap: API-only, no frontend scaffolding

- **Description**: Set up `package.json` for the API only (`api/` subfolder), wire Express + Prisma, implement only the Clients bounded context. No frontend (`src/`) scaffolding in this change.
- **Pros**:
  - Focused scope — this change is about the Clients _model_ and API, not the UI
  - Faster to implement and verify
  - Docker Compose can spin up `api` + `db` without a frontend service
  - Matches the change name: "Create the model Clients in a **new API**"
- **Cons**:
  - Will need a follow-up change to scaffold the frontend and full Docker composition
  - The `app` Docker service is missing until frontend is added
- **Effort**: Medium
- **Recommended**: ✅ YES — this is the correct scope for this change

### Option B — Full monorepo bootstrap: API + frontend + Docker

- **Description**: Scaffold both `src/` (React + Vite) and `api/` in a single change, along with complete Docker Compose.
- **Pros**:
  - Everything works end-to-end from day one
  - Docker Compose has all 3 services (`app`, `api`, `db`)
- **Cons**:
  - Violates the Single Responsibility Principle for a change — mixes two distinct concerns
  - Too large for one PR/change — harder to review, harder to test
  - Risk of scope creep
- **Effort**: High
- **Recommended**: ❌ NO — split into separate changes

### Option C — Start with Prisma schema only (schema-first)

- **Description**: Create `prisma/schema.prisma` with the Client model and run `prisma migrate` before writing any application code.
- **Pros**:
  - Schema-first approach aligns with Prisma's intended workflow
  - Can verify the DB model before writing business logic
- **Cons**:
  - Not TDD-compliant — no test drives the schema
  - Missing the full Clean Architecture stack (domain entity, use cases, controller)
  - Not a useful deliverable by itself (can't call the API)
- **Effort**: Low
- **Recommended**: ❌ NO — this is a step within Option A, not a standalone approach

---

## Recommendation

**Option A — API-only bootstrap for the Clients bounded context.**

### Rationale

1. **Scope is correct**: "Create the model Clients in a new API" targets the API layer. Frontend is a separate concern.
2. **TDD is mandatory** (per AGENTS.md): the implementation order must be Red → Green → Refactor, starting with domain entity tests, then use case tests, then repository integration tests, then controller tests. The Prisma schema emerges from the domain model, not the other way around.
3. **Clean Architecture ordering**: build inward → outward:
   - `domain/` first (entity + repository interface) → drives design
   - `application/` second (use cases) → business logic, testable in isolation
   - `infrastructure/` third (Prisma repository) → implements the interface
   - `interface/` fourth (Express controller + routes) → glues it together
4. **AGENTS.md hard rules to honor**:
   - `status` as `TINYINT` (0/1), not a string enum
   - No `FOREIGN KEY` constraints in migrations
   - FTS via `FULLTEXT(name, email)` — `ft_min_word_len = 2` in `my.cnf`
   - FTS input sanitized before passing to `AGAINST()` — no raw user strings
   - Raw SQL only in `infrastructure/` — use cases never touch Prisma directly
   - OWASP Top 10 checklist on every layer

### Implementation Order (TDD — strict Red/Green/Refactor)

```
1. Bootstrap (no production code yet):
   - package.json for api/
   - tsconfig.json (strict)
   - Vitest config
   - Docker Compose (api + db services only)
   - docker/my.cnf (ft_min_word_len=2)
   - .env.example

2. Domain layer (test first):
   - RED: Write Client entity unit tests
   - GREEN: Implement Client.ts entity
   - RED: Write IClientRepository interface tests (contract tests)
   - GREEN: Implement IClientRepository.ts
   - REFACTOR: Review domain purity (no framework imports)

3. Application layer (test first):
   - RED: Write CreateClientUseCase.test.ts (mock repository)
   - GREEN: Implement CreateClientUseCase.ts
   - Repeat for Get, List, Update, Deactivate use cases
   - REFACTOR: Extract shared validation logic

4. Infrastructure layer (test second — needs DB):
   - prisma/schema.prisma — Client model
   - Run: prisma migrate dev --name init_clients
   - FULLTEXT index in migration SQL
   - RED: Write PrismaClientRepository integration test
   - GREEN: Implement PrismaClientRepository.ts
   - REFACTOR: Sanitize FTS input (ClientFtsQuery value object or util)

5. Interface layer (test first):
   - RED: Write ClientController.test.ts (mock use cases)
   - GREEN: Implement ClientController.ts + ClientRoutes.ts
   - Implement DTOs (CreateClientDto, UpdateClientDto)
   - REFACTOR: Ensure controller is thin (no business logic)

6. Wire up Express app:
   - api/index.ts (app entry point)
   - Mount ClientRoutes
   - Structured logger (pino)

7. E2E smoke test (Playwright or curl):
   - POST /clients → 201
   - GET /clients/:id → 200
   - GET /clients?search=term → 200 (FTS)
```

---

## REST API Contract (target)

| Method | Path | Description | Status Codes |
|--------|------|-------------|--------------|
| `POST` | `/api/v1/clients` | Create a new client | 201, 400, 409 |
| `GET` | `/api/v1/clients` | List clients (paginated, optional `?search=`) | 200 |
| `GET` | `/api/v1/clients/:id` | Get a single client by ID | 200, 404 |
| `PUT` | `/api/v1/clients/:id` | Update client fields | 200, 400, 404 |
| `DELETE` | `/api/v1/clients/:id` | Soft-delete (set deleted_at) | 204, 404 |
| `PATCH` | `/api/v1/clients/:id/deactivate` | Set status=0 (inactive) | 200, 404 |

**Query params for `GET /api/v1/clients`**:
- `search` — FTS term (sanitized, passed to `MATCH(name, email) AGAINST(? IN BOOLEAN MODE)`)
- `page` — page number (default: 1)
- `limit` — page size (default: 20, max: 100)
- `status` — filter by status: `0` | `1` (optional)

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **No existing bootstrap** — must scaffold everything | 🔴 HIGH | Scope strictly to API only (Option A); frontend is a separate change |
| **TDD on infrastructure** requires a running DB | 🟡 MEDIUM | Use Docker Compose test DB or in-memory SQLite via Prisma for integration tests |
| **FTS minimum word length** (default 4 chars) will reject short pet/owner names | 🟡 MEDIUM | Configure `ft_min_word_len = 2` in `my.cnf` and restart MySQL — document in docker/my.cnf |
| **FTS operator injection** — raw user strings break `AGAINST()` syntax | 🟡 MEDIUM | Implement `sanitizeFtsQuery()` util in `api/shared/utils/`; strip `+ - * " ( )` |
| **Prisma FULLTEXT index** not natively supported via Prisma schema syntax | 🟡 MEDIUM | Use `@@fulltext` Prisma preview feature (MySQL connector), OR define via raw SQL in migration |
| **Status field** must be `TINYINT`, not Prisma enum | 🟡 MEDIUM | Use `Int @db.TinyInt` in Prisma schema; document 0/1 mapping in domain layer |
| **No foreign keys** rule | 🟢 LOW | Already part of AGENTS.md conventions; simple to enforce by not using `@relation` for cross-context refs |
| **Strict TypeScript** from day one | 🟢 LOW | Greenfield advantage — `"strict": true` in tsconfig from the start |

---

## Ready for Proposal

**Yes — with clear scope.**

The domain is well-specified in AGENTS.md. The stack is fully defined (Node.js + Express + MySQL 8 + Prisma + Vitest + Docker Compose). The only open question is whether this change should include the API bootstrap infrastructure (package.json, Docker, etc.) or whether that should be a prerequisite change.

**Recommendation**: include bootstrap in this change, since without it no code can run or be tested. The bootstrap is _minimal_ (api-side only).

**Questions for orchestrator to surface to user**:
1. Should the frontend (`src/` + Vite + React) be part of this change, or a separate follow-up?
2. Should Prisma be installed at the root level (monorepo-style) or inside `api/` only?

---

*Generated by sdd-explore skill · pfmaster · 2026-06-24*
