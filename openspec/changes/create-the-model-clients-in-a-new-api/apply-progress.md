# Apply Progress: Create the Clients Model in a New API

## Overall Status
**PR 1 of 3 — Bootstrap (T01–T14)**: ✅ Complete — 14/14 tasks done, 15/15 tests pass
**PR 2 of 3 — Domain + Application (T15–T23c)**: ✅ Complete — 11/11 tasks done, 45/45 tests pass
**PR 3 of 3 — Infrastructure + Interface (T24–T32)**: 🔲 Pending

---

## Completed Tasks

### Phase 1 — Bootstrap (PR 1)

- [x] **T01** · `package.json` — express, prisma, @prisma/client, pino, dotenv; devDeps: typescript, ts-node, tsx, vitest, @vitest/coverage-v8, supertest, @types/*; scripts: dev, build, start, test, test:integration, migrate, generate
- [x] **T02** · `tsconfig.json` — strict: true, target: ES2022, module: CommonJS, paths: @api/→api/, @/→src/, outDir: dist, rootDir: .
- [x] **T03** · `vitest.config.ts` — includes api/**/*.test.ts, excludes *.integration.test.ts, resolve aliases @api/ and @/, coverage v8
- [x] **T04** · `docker/my.cnf` — ft_min_word_len=2, innodb_ft_min_token_size=2, innodb_buffer_pool_size=256M
- [x] **T05** · `docker-compose.yml` — api (Node 20 Alpine, port 3000, volumes), db (MySQL 8, healthcheck, data volume), docker/my.cnf mounted, network pfmaster-net; also created `docker/Dockerfile`
- [x] **T06** · `.env.example` — DATABASE_URL, PORT, NODE_ENV, LOG_LEVEL, DB_ROOT_PASSWORD, DB_NAME, DB_USER, DB_PASSWORD
- [x] **T07** · `prisma/schema.prisma` — mysql provider, previewFeatures=[fullTextSearch,fullTextIndex], Client model with TINYINT status, @@fulltext([name,email]), no @relation fields
- [x] **T08** · `api/observability/logger.ts` — pino JSON logger, LOG_LEVEL from env, pino-pretty transport in development mode only
- [x] **T09** · `api/shared/infrastructure/prisma.ts` — PrismaClient singleton with global cache for hot-reload safety
- [x] **T10** · `api/shared/domain/BaseEntity.ts` — shared `{ id, createdAt, updatedAt }` interface
- [x] **T11** · **RED** `api/shared/utils/sanitizeFtsQuery.test.ts` — 13 failing tests: 6 operators individually, combined, operators-only, empty, normal term, trim, whitespace collapse
- [x] **T12** · **GREEN** `api/shared/utils/sanitizeFtsQuery.ts` — pure function strips + - * " ( ), trims. All 13 T11 tests pass.
- [x] **T13** · **RED** `api/index.test.ts` — supertest: GET /health → 200 { status: ok }, unknown → 404
- [x] **T14** · **GREEN** `api/index.ts` — Express app, JSON body parser, request logging, /health route, 404 handler, DATABASE_URL startup validation. All T13 tests pass.

### Phase 2 — Domain + Application (PR 2)

- [x] **T15** · `api/clients/domain/Client.ts` — `ClientStatus = 0 | 1`, `CLIENT_STATUS` const, `Client` interface, `CreateClientInput`, `UpdateClientInput`. Zero framework imports.
- [x] **T16** · `api/clients/domain/ClientErrors.ts` — `ClientNotFoundError`, `ClientValidationError`, `ClientAlreadyDeletedError`. All extend Error with name set.
- [x] **T17** · `api/clients/domain/IClientRepository.ts` — interface: `create`, `findById`, `findAll(page, limit)`, `update`, `softDelete`, `search`. Domain types only, no Prisma.
- [x] **T18** · **RED** `api/clients/application/CreateClient.test.ts` — 7 failing tests: happy path, name empty/whitespace, email empty/no-@, phone empty/whitespace; repo.create not called on error
- [x] **T19** · **GREEN** `api/clients/application/CreateClient.ts` — validates name/email/phone, default status ACTIVE via repository. All T18 tests pass.
- [x] **T20** · **RED** `api/clients/application/GetClient.test.ts` — 8 failing tests: GetClient happy/null/deletedAt; ListClients paginated/defaults/clamp/page<1/limit<1
- [x] **T21** · **GREEN** `api/clients/application/GetClient.ts` + `ListClients.ts` — GetClient throws on null or deletedAt; ListClients defaults page=1 limit=20, clamps to 100, validates. All T20 tests pass.
- [x] **T22** · **RED** `api/clients/application/UpdateClient.test.ts` — 10 failing tests: UpdateClient (4), SoftDeleteClient (3), DeactivateClient (3)
- [x] **T23** · **GREEN** `api/clients/application/UpdateClient.ts` + `SoftDeleteClient.ts` + `DeactivateClient.ts` — full happy/error paths. All T22 tests pass.
- [x] **T23b** · **RED** `api/clients/application/SearchClients.test.ts` — 5 failing tests: results, sanitization, empty/operators-only/whitespace skips repo
- [x] **T23c** · **GREEN** `api/clients/application/SearchClients.ts` — sanitizeFtsQuery before repo; returns [] without calling repo on blank sanitized term. All T23b tests pass.

---

## Files Created — PR 1

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Created | Runtime + dev deps, npm scripts |
| `tsconfig.json` | Created | TypeScript strict config with path aliases |
| `vitest.config.ts` | Created | Vitest config for api/ unit tests |
| `.env.example` | Created | Environment variable documentation |
| `docker-compose.yml` | Created | api + db services, pfmaster-net |
| `docker/Dockerfile` | Created | Node 20 Alpine for api service |
| `docker/my.cnf` | Created | MySQL ft_min_word_len=2 config |
| `prisma/schema.prisma` | Created | Client model with FULLTEXT index |
| `api/observability/logger.ts` | Created | pino JSON logger singleton |
| `api/shared/infrastructure/prisma.ts` | Created | PrismaClient singleton |
| `api/shared/domain/BaseEntity.ts` | Created | Shared entity base interface |
| `api/shared/utils/sanitizeFtsQuery.ts` | Created | FTS input sanitizer |
| `api/shared/utils/sanitizeFtsQuery.test.ts` | Created | 13 unit tests |
| `api/index.ts` | Created | Express app entry point |
| `api/index.test.ts` | Created | 2 integration tests |

## Files Created — PR 2

| File | Action | Description |
|------|--------|-------------|
| `api/clients/domain/Client.ts` | Created | Client entity + ClientStatus + CreateClientInput + UpdateClientInput |
| `api/clients/domain/ClientErrors.ts` | Created | ClientNotFoundError + ClientAlreadyDeletedError + ClientValidationError |
| `api/clients/domain/IClientRepository.ts` | Created | Repository contract (domain types only) |
| `api/clients/application/CreateClient.ts` | Created | CreateClient use case with validation |
| `api/clients/application/CreateClient.test.ts` | Created | 7 unit tests |
| `api/clients/application/GetClient.ts` | Created | GetClient use case |
| `api/clients/application/ListClients.ts` | Created | ListClients use case with pagination guard |
| `api/clients/application/GetClient.test.ts` | Created | 8 unit tests (GetClient + ListClients) |
| `api/clients/application/UpdateClient.ts` | Created | UpdateClient use case (status-immutable) |
| `api/clients/application/SoftDeleteClient.ts` | Created | SoftDeleteClient use case |
| `api/clients/application/DeactivateClient.ts` | Created | DeactivateClient use case (PATCH endpoint) |
| `api/clients/application/UpdateClient.test.ts` | Created | 10 unit tests (Update + SoftDelete + Deactivate) |
| `api/clients/application/SearchClients.ts` | Created | SearchClients use case with FTS sanitization |
| `api/clients/application/SearchClients.test.ts` | Created | 5 unit tests |

---

## Test Results

### PR 1 Final
```
Test Files  2 passed (2)
     Tests  15 passed (15)
  Duration  261ms
```

### PR 2 Final
```
Test Files  6 passed (6)
     Tests  45 passed (45)
  Duration  326ms
```

TypeScript: `tsc --noEmit` exits 0 — zero errors across both PRs.

---

## TDD Evidence

### PR 1

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| T11+T12 sanitizeFtsQuery | ✅ 13 tests fail (file missing) | ✅ regex impl, all pass | ✅ JSDoc added |
| T13+T14 health endpoint | ✅ 2 tests fail (file missing) | ✅ Express app, all pass | ✅ logger fixed for test env |

### PR 2

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| T18+T19 CreateClient | ✅ fails (file missing) | ✅ validation + repo.create, 7/7 pass | ✅ clean |
| T20+T21 GetClient + ListClients | ✅ fails (file missing) | ✅ null+deletedAt guards, clamp logic, 8/8 pass | ✅ clean |
| T22+T23 Update+SoftDelete+Deactivate | ✅ fails (file missing) | ✅ all guards + ClientAlreadyDeletedError, 10/10 pass | ✅ clean |
| T23b+T23c SearchClients | ✅ fails (file missing) | ✅ sanitize-before-repo, skip on empty, 5/5 pass | ✅ clean |

---

## Deviations from Design

### PR 1
1. **pino-pretty only in development** — pino transport worker fails in Vitest; test env uses plain JSON.
2. **`docker/Dockerfile` added** — required by docker-compose build context, not listed in design.
3. **pino-pretty as devDependency** — required for development-only transport.

### PR 2
1. **`ClientAlreadyDeletedError` added** — the orchestrator prompt specified this error class for `SoftDeleteClient` (already-deleted case). The design only listed `ClientNotFoundError + ClientValidationError`. Added all three to `ClientErrors.ts` without removing the others.
2. **`UpdateClientInput.status?` added** — `DeactivateClient` needs to call `repository.update(id, { status: 0 })`. `UpdateClientInput` had no status field. Added optional `status?: ClientStatus` with JSDoc noting it's only for `DeactivateClient` — never exposed in `UpdateClientDto`.
3. **`UpdateClient` explicitly strips status** — uses `Omit<UpdateClientInput, 'status'>` in its signature to enforce the immutability rule at the type level.
4. **`DeactivateClient` added** — orchestrator specified this as a separate use case (for PATCH /clients/:id/deactivate). The design mentioned it in open questions but not as an explicit file. Implemented as `DeactivateClientUseCase`.

---

## Git Commits

### PR 1 branch (`feature/clients-api-pr1`)
```
96be869 fix: skip DATABASE_URL guard in test environment
53143cf docs: add PR 1 apply-progress artifact
07c0a27 chore: mark T01-T14 complete in tasks.md
9ac4508 docs: add openspec design, specs, and tasks artifacts
4c8c27b feat: add Express app entry point with health endpoint (GREEN)
89989ad test: add health endpoint integration test (RED)
b52a492 feat: implement sanitizeFtsQuery (GREEN)
7cfa286 test: add sanitizeFtsQuery unit tests (RED)
6ec3703 feat: add pino logger, prisma singleton, and BaseEntity
bf267d9 feat: add prisma schema with Client model
f6c35b4 chore: add docker-compose, mysql config, and env example
728e89f chore: bootstrap package.json, tsconfig, and vitest config
```

### PR 2 branch (`feature/clients-api-pr2`)
```
f20a245 feat(clients): implement SearchClients use case (green)
8f65e7f feat(clients): implement UpdateClient, SoftDeleteClient, DeactivateClient use cases (green)
6976513 feat(clients): implement GetClient and ListClients use cases (green)
4504cdb test(clients): add CreateClient use case tests (red)
cfffab4 feat(clients): add Client entity, IClientRepository interface, and domain errors
```

---

## Workload / PR Boundary

- **Mode**: Chained PR slice (feature-branch-chain)
- **PR 1 unit**: Bootstrap — `feature/clients-api-pr1` → `feature/clients-api` (tracker)
- **PR 2 unit**: Domain + Application — `feature/clients-api-pr2` → `feature/clients-api-pr1`
- **PR 3 unit**: Infrastructure + Interface — `feature/clients-api-pr3` → `feature/clients-api-pr2` (pending)
- **PR 2 review budget**: ~320 estimated lines

---

## Remaining Tasks

### Phase 3 — Infrastructure + Interface (PR 3)

- [ ] T24 · `api/clients/interface/dtos/CreateClientDto.ts`
- [ ] T25 · `api/clients/interface/dtos/UpdateClientDto.ts` — no status field
- [ ] T26 · `api/clients/interface/dtos/ClientResponseDto.ts` — omits deletedAt
- [ ] T27 · **RED** `api/clients/infrastructure/PrismaClientRepository.test.ts` — integration (Docker MySQL)
- [ ] T28 · **GREEN** `api/clients/infrastructure/PrismaClientRepository.ts`
- [ ] T29 · **RED** `api/clients/interface/ClientController.test.ts` — supertest
- [ ] T30 · **GREEN** `api/clients/interface/ClientController.ts`
- [ ] T31 · `api/clients/interface/clientRouter.ts`
- [ ] T32 · Update `api/index.ts` — mount clientRouter at /api/v1/clients

---

## Next Recommended

Review PR 2 (`feature/clients-api-pr2` → `feature/clients-api-pr1`), then apply PR 3 (T24–T32) on a new branch `feature/clients-api-pr3` targeting `feature/clients-api-pr2`.
