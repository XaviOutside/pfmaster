# Proposal: Create the Clients Model in a New API

## Intent

pfmaster has no backend code yet. A grooming business cannot track any clients, pets, or appointments without a running API and database. This change bootstraps the entire backend infrastructure and delivers the Clients bounded context end-to-end — creating the foundation every other domain will build on.

## Scope

### In Scope
- Root-level project bootstrap: `package.json`, `tsconfig.json`, `vitest.config.ts`
- Docker Compose stack: `docker-compose.yml`, `docker/my.cnf` (`ft_min_word_len=2`)
- Environment template: `.env.example`
- Prisma schema with Client model, FULLTEXT index preview feature, MySQL connector
- Database migration for `clients` table (TINYINT status, soft-delete via `deleted_at`, FULLTEXT on `name, email`)
- `api/clients/` bounded context — all four Clean Architecture layers (domain, application, interface, infrastructure)
- Six use cases: CreateClient, GetClient, ListClients, UpdateClient, SoftDeleteClient, SearchClients
- `api/shared/` — base entity, repository interface, `sanitizeFtsQuery` utility, Prisma singleton
- `api/observability/logger.ts` — structured logger (pino)
- `api/index.ts` — Express app entry point with route wiring
- Unit tests (Vitest) for all use cases and the sanitize utility — TDD Red/Green/Refactor mandatory
- OWASP Top 10 review at every layer

### Out of Scope
- Frontend (React/Vite/`src/`) — separate change
- Pets, Services, Appointments bounded contexts
- Authentication / multi-user roles
- Payment processing, email/SMS notifications
- Playwright end-to-end tests (no UI yet)
- SonarQube and Snyk CI integration (config scaffolded, execution deferred to CI setup change)

## Capabilities

### New Capabilities
- `client-management`: Full CRUD + soft-delete lifecycle for Client records via REST API
- `client-search`: Full-text search over client name and email using MySQL FTS with sanitized input
- `api-bootstrap`: Express server, Prisma connection, pino logger, Docker Compose stack

### Modified Capabilities
None — greenfield project; no existing specs.

## Approach

TDD order (inward → outward per Clean Architecture):

1. **Domain** — `Client` entity, `ClientStatus` enum (0/1 TINYINT), `IClientRepository` interface, `ClientErrors`
2. **Application** — write failing Vitest tests for each use case first; implement use cases to green; refactor
3. **Infrastructure** — `PrismaClientRepository` implementing `IClientRepository`; Prisma schema + migration
4. **Interface** — `ClientController` and Express routes wiring use cases to HTTP; request/response DTOs
5. **Bootstrap** — `api/index.ts` mounts routes; Docker Compose brings up `api` + `db`

No raw SQL in route handlers. All DB queries go through the repository. FTS input always passes through `sanitizeFtsQuery()` before `MATCH ... AGAINST`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | New | Root deps: Express, Prisma, Vitest, pino, TypeScript |
| `tsconfig.json` | New | Strict mode, path aliases (`@/`) |
| `docker-compose.yml` | New | Services: `api` (port 3000), `db` (MySQL 8) |
| `docker/my.cnf` | New | `ft_min_word_len=2` for short pet/client names |
| `prisma/schema.prisma` | New | Client model, FULLTEXT preview feature |
| `api/clients/` | New | Full bounded context — 4 layers |
| `api/shared/` | New | Base abstractions + sanitizeFtsQuery + Prisma singleton |
| `api/observability/` | New | Structured logger (pino) |
| `api/index.ts` | New | Express entry point |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prisma FULLTEXT preview not recognized | Low | Confirm `previewFeatures = ["fullTextSearch", "fullTextIndex"]` in schema; test with a migration dry-run |
| `ft_min_word_len=2` not applied in Docker | Med | Mount `docker/my.cnf` as volume in Compose; verify with `SHOW VARIABLES LIKE 'ft_min%'` |
| FTS operator injection via client input | Med | `sanitizeFtsQuery()` strips `+ - * " ( )` before `AGAINST()` — covered by unit tests |
| TINYINT enum value drift | Low | TypeScript `ClientStatus` union type + runtime validation in DTO layer |
| 400-line PR budget exceeded | High | Greenfield bootstrap will exceed 400 lines — chained PRs recommended (bootstrap → domain+app → infra+interface) |

## Rollback Plan

All changes are additive on a greenfield repo. To revert:
1. Drop the `clients` table: `DROP TABLE clients;`
2. Delete generated Prisma client: `rm -rf node_modules/.prisma`
3. Delete `api/`, `prisma/`, Docker files, and root config files
4. `git revert` the commit range or reset the branch to the pre-change SHA

No data migration needed — no prior data exists.

## Dependencies

- Docker Desktop running locally for `docker compose up`
- Prisma CLI (`npx prisma migrate dev`) access to the running `db` container

## Success Criteria

- [ ] `docker compose up -d` starts `api` and `db` without errors
- [ ] `POST /api/v1/clients` creates a client and returns `201` with the created resource
- [ ] `GET /api/v1/clients?q=term` returns clients matching FTS query; returns `[]` for no match
- [ ] `GET /api/v1/clients/:id` returns `404` for non-existent or soft-deleted client
- [ ] `DELETE /api/v1/clients/:id` sets `deleted_at` and returns `204`; subsequent GET returns `404`
- [ ] All use-case unit tests pass (`npm run test`)
- [ ] No raw SQL outside `infrastructure/`; no Prisma client import outside `infrastructure/`
- [ ] `sanitizeFtsQuery` unit tests cover all FTS operator characters
- [ ] OWASP Top 10 checklist reviewed and signed off per layer
