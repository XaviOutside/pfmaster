# Spec: Create the Clients Model in a New API

**Change**: create-the-model-clients-in-a-new-api  
**Mode**: New (greenfield — no existing specs to delta against)  
**Capability areas**: api-bootstrap | client-management | client-search

---

## Capability Specs Index

| Capability | Spec File | Type | Requirements | Scenarios |
|------------|-----------|------|-------------|-----------|
| api-bootstrap | specs/api-bootstrap/spec.md | New (full) | 5 | 11 |
| client-management | specs/client-management/spec.md | New (full) | 9 | 26 |
| client-search | specs/client-search/spec.md | New (full) | 5 | 16 |

**Total**: 19 requirements · 53 scenarios

---

## Global Out of Scope

- Frontend (React / Vite / `src/`) — separate change
- Pets, Services, Appointments bounded contexts
- Authentication / multi-user roles
- Payment processing, email/SMS notifications
- Playwright end-to-end tests (no UI yet)
- SonarQube and Snyk CI pipeline execution (deferred to CI setup change)

---

## Cross-Cutting Rules (apply to all three capabilities)

1. **TDD mandatory** — every requirement has at least one failing test before production code is written (Red → Green → Refactor).
2. **No raw SQL outside `infrastructure/`** — all DB access goes through repository implementations only.
3. **No Prisma client imports outside `infrastructure/`** — domain and application layers are framework-free.
4. **OWASP Top 10 required** — injection prevention, no stack trace leakage, PII not logged.
5. **TINYINT enums** — `status` is `TINYINT` in MySQL; `ClientStatus = 0 | 1` in TypeScript.
6. **No foreign keys** — referential integrity enforced at application layer only.
7. **FTS sanitization always** — `sanitizeFtsQuery()` is the single gate between user input and `AGAINST()`.
8. **Soft-delete pattern** — `deletedAt` field; records are never physically deleted.

---

## Summary

### api-bootstrap
Express + Prisma + pino + Docker Compose stack. Greenfield. Key requirements: project config files (tsconfig strict, path aliases), Docker Compose with `ft_min_word_len=2` in `my.cnf`, `/health` endpoint, pino JSON logger confined to `interface/` and `infrastructure/` layers, Prisma singleton with FULLTEXT preview features enabled.

### client-management
Full Clients bounded context across four Clean Architecture layers. Key requirements: `Client` entity with `ClientStatus = 0 | 1`, `IClientRepository` interface, five use cases (CreateClient, GetClient, ListClients, UpdateClient, SoftDeleteClient), `PrismaClientRepository` with soft-delete filters, REST endpoints returning `ClientResponseDto`, Prisma migration with FULLTEXT index and no FOREIGN KEY constraints.

### client-search
FTS over `name` and `email` columns. Key requirements: `sanitizeFtsQuery` pure utility strips `+ - * " ( )`, `SearchClients` use case returns empty array for empty/operator-only queries, `IClientRepository.search()` uses parameterized `MATCH ... AGAINST`, `GET /api/v1/clients/search?q=` endpoint returns 200 array (empty is valid), missing `q` returns 400.
