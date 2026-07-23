# Tasks: Multi-Tenant Authentication System

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1650 (16 new files, 10 modified) |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Delivery strategy | ask-on-risk (default) |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 (stacked to main) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Schema, migration, seed | PR 1 | `npx prisma migrate dev && npm run db:seed` | N/A (schema change, no runtime) | Revert migration + schema |
| 2 | Domain entities, interfaces, use cases, password service, all unit tests | PR 2 | `npx vitest run api/auth/domain api/auth/application api/auth/infrastructure/Argon2PasswordService` | N/A (no HTTP wiring) | `rm -rf api/auth/` |
| 3 | Repository, middleware, controller, router, DTOs, wire into index.ts, integration tests | PR 3 | `npm run test:integration` (filtered to auth) | `curl -X POST localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@peluclic.com","password":"...pwd..."}'` | Remove auth middleware + router from api/index.ts |
| 4 | LoginPage, HTTP client, App.tsx route, package.json, .env.example, Docker | PR 4 | `npm run test:frontend -- src/pages/LoginPage src/services/http` | `npm run dev:frontend` → visit /login → login → see /clients | Revert LoginPage, http.ts, App.tsx, package.json |

---

## Phase 1: Database Foundation

- [x] 1.1 Prisma schema: add `Company` (id, name, status), `User` (id, companyId, email, passwordHash, role, status), `Session` (id, token, userId, companyId, expiresAt) models; add `companyId Int @default(1)` to Client, Pet, Service, Appointment, CompanySettings → `prisma/schema.prisma` (FR-AUTH-7, FR-AUTH-8, FR-AUTH-9)
- [x] 1.2 Generate migration: CREATE TABLEs + ALTER TABLEs + seed INSERT (company id=1 "Default Company", user admin@peluclic.com with Argon2id hash); verify `npx prisma migrate dev` succeeds → `prisma/migrations/` (FR-AUTH-6)
- [x] 1.3 Update seed.ts: idempotent seed (INSERT IGNORE) for default company + admin user using `SEED_ADMIN_PASSWORD` env var; run `npm run db:seed` → `prisma/seed.ts`
- [x] 1.4 Prisma client: `npx prisma generate`

## Phase 2: Auth Domain + Application (TDD)

- [x] 2.1 Domain entities: `Company.ts` (CompanyStatus 0|1), `User.ts` (UserRole 0|1, UserStatus 0|1), `Session.ts` (Session + SessionWithUser for middleware), `AuthErrors.ts` (InvalidCredentialsError, SessionExpiredError, SessionNotFoundError) → `api/auth/domain/` (FR-AUTH-8)
- [x] 2.2 Domain interfaces: `IAuthRepository.ts` (findUserByEmail, createSession, findValidSession, invalidateSession), `IPasswordService.ts` (hash, verify) → `api/auth/domain/`
- [x] 2.3 [RED] Write `LoginUseCase.test.ts`: 4 paths — valid credentials, wrong password, unknown email, password < 8 chars (FR-AUTH-1, FR-AUTH-10)
- [x] 2.4 [GREEN] Implement `LoginUseCase.ts`: validate email/password ≥8 chars → findUserByEmail → verify hash → createSession → return {token, user} → `api/auth/application/` (FR-AUTH-1, FR-AUTH-5, FR-AUTH-10)
- [x] 2.5 [RED] Write `LogoutUseCase.test.ts`: valid session → soft-deleted, already-invalidated → idempotent 204 (FR-AUTH-2)
- [x] 2.6 [GREEN] Implement `LogoutUseCase.ts`: invalidateSession (set deleted_at) → `api/auth/application/` (FR-AUTH-2)
- [x] 2.7 Argon2PasswordService + test: `argon2.hash()` with argon2id config (memoryCost/timeCost/parallelism from env), `argon2.verify()` → `api/auth/infrastructure/Argon2PasswordService.ts` + `.test.ts` (FR-AUTH-5)

## Phase 3: Auth HTTP Layer + API Wiring (TDD)

- [ ] 3.1 PrismaAuthRepository + integration test: Prisma `findUserByEmail`, `createSession` (UUID v4 token, expires_at), `findValidSession` (JOIN users + companies, check expires_at > NOW()), `invalidateSession` (soft-delete) → `api/auth/infrastructure/PrismaAuthRepository.ts` + `.integration.test.ts` (FR-AUTH-1, FR-AUTH-3)
- [ ] 3.2 DTOs: `LoginRequestDto.ts` ({email, password}), `LoginResponseDto.ts` ({token, user}) with `toLoginResponseDto()` role TINYINT→string mapper → `api/auth/interface/dtos/`
- [ ] 3.3 [RED] Write `AuthController.test.ts`: mock use cases throwing each error type → verify 401/422/204/500 mappings (FR-AUTH-1, FR-AUTH-2)
- [ ] 3.4 [GREEN] Implement `AuthController.ts` + `authRouter.ts`: POST /login → 200 + token, POST /logout → 204, errorHandler for domain errors → `api/auth/interface/`
- [ ] 3.5 [RED] Write `authMiddleware.test.ts`: token extraction (missing header, malformed Bearer, expired token), session validation (valid → sets req fields, invalid/expired → 401) → `api/auth/interface/` (FR-AUTH-3, FR-AUTH-4)
- [ ] 3.6 [GREEN] Implement `authMiddleware.ts`: `createAuthMiddleware(repo)` → extract Bearer token → findValidSession → attach `req.companyId`, `req.userId`, `req.role` via Express declaration merging → `api/auth/interface/` (FR-AUTH-3, FR-AUTH-4)
- [ ] 3.7 Wire `api/index.ts`: add `'Authorization'` to CORS `allowedHeaders` (L74), add auth rate limiter (5 req/15min on `/api/v1/auth/login`), mount `authMiddleware` BEFORE existing routes, mount `authRouter` at `/api/v1/auth` — login route excluded from middleware → `api/index.ts`
- [ ] 3.8 Integration tests: POST /login → 200 with token + user, wrong pw → 401 (uniform message), short pw → 422, POST /logout → 204 → subsequent request → 401, GET /clients without token → 401, GET /clients with token → 200 (all delta specs: FR-AUTH-1 through FR-AUTH-4, services/pets/appointments delta gates) → `api/auth/` (use supertest against real app imported from `api/index.ts`)

## Phase 4: Frontend + Config + Cleanup

- [ ] 4.1 LoginPage: email/password form with `type="password"`, loading state (disabled submit + spinner), inline error on 401, store token+user in `localStorage`, redirect to `/clients` → `src/pages/LoginPage.tsx` + `.test.tsx` (FR-AUTH-LOGIN)
- [ ] 4.2 HTTP client: inject `Authorization: Bearer <token>` from `localStorage` into all requests; handle missing token gracefully (proceed without header) → `src/services/http.ts` + update `http.test.ts` (FR-AUTH-HEADER)
- [ ] 4.3 Add `/login` route inside `PublicLayout` → `src/App.tsx`
- [ ] 4.4 Config: add `argon2` to `package.json` dependencies; add `SESSION_DURATION_HOURS=24`, `ARGON2_MEMORY_COST=65536`, `ARGON2_TIME_COST=3`, `ARGON2_PARALLELISM=4`, `SEED_ADMIN_PASSWORD` to `.env.example`
- [ ] 4.5 Verify Docker build: if `argon2` fails native compilation on Alpine, add `gcc make python3` to `docker/Dockerfile` RUN step; rebuild with `docker compose build api`
- [ ] 4.6 Run full test suite: `npm run gate` (lint + build + test) — verify no regressions; `npm run test:integration` — verify all passing

---

**Note on test impact**: Controller tests (Client, Pet, Service, Appointment, Settings) create isolated Express apps without middleware — they are unaffected. The only existing test file loading the real app is `api/index.test.ts`, which tests `/health` (unprotected) — minimal impact expected. E2E tests are Phase 2 scope.
