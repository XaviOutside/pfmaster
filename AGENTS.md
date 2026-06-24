# pfmaster — Project Instructions for AI Agents

## Project Overview

**pfmaster** is a pet grooming and care management web application. It manages:

- **Clients** — pet owners with contact information and history
- **Pets** — animals belonging to clients, with breed, age, medical notes, and service history
- **Services** — grooming treatments (haircuts, baths, nail trimming, dental cleaning, etc.) with pricing and duration

The application targets small-to-medium pet grooming businesses and veterinary clinics that need to track client appointments, pet profiles, and service records in one place.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 |
| Unit / component tests | Vitest |
| End-to-end tests | Playwright |
| Database | MySQL 8+ |
| ORM | Prisma |
| Search | MySQL Full-Text Search (FTS) |
| Dev environment | Docker Compose |

---

## Architecture

### Frontend

- **React + TypeScript** with strict mode enabled
- **Vite** for development server and production builds
- **Tailwind CSS v4** for utility-first styling — use CSS custom properties (`@theme`) for design tokens, not the `tailwind.config.js` v3 syntax
- Component structure follows **Atomic Design**: atoms → molecules → organisms → pages
- State management: local component state first; lift only when needed; global store only for auth/session

### Clean Architecture (MANDATORY)

The backend follows Clean Architecture. Dependencies always point inward — outer layers know about inner layers, never the reverse:

```
  ┌─────────────────────────────────┐
  │  Infrastructure (DB, HTTP, etc) │  ← outermost: frameworks, drivers, adapters
  │  ┌───────────────────────────┐  │
  │  │  Interface (controllers,  │  │  ← delivery: routes, controllers, DTOs
  │  │  routes, serializers)     │  │
  │  │  ┌─────────────────────┐  │  │
  │  │  │  Application        │  │  │  ← use cases: orchestrate domain, no framework deps
  │  │  │  (use cases)        │  │  │
  │  │  │  ┌───────────────┐  │  │  │
  │  │  │  │  Domain       │  │  │  │  ← innermost: entities, value objects, repo interfaces
  │  │  │  │  (entities,   │  │  │  │
  │  │  │  │  interfaces)  │  │  │  │
  │  │  │  └───────────────┘  │  │  │
  │  │  └─────────────────────┘  │  │
  │  └───────────────────────────┘  │
  └─────────────────────────────────┘
```

Rules:
- **Domain** — pure business entities and repository interfaces; zero framework or DB imports
- **Application** — use cases only; depends on domain interfaces, never on concrete implementations
- **Interface** — controllers, route handlers, request/response DTOs; depends on use cases
- **Infrastructure** — MySQL repositories, Express wiring, external services; implements domain interfaces

### Backend / API

- REST API layer (Node.js + Express or equivalent) served via Docker
- MySQL 8+ as the primary database
- **Full-Text Search**: use MySQL `FULLTEXT` indexes and `MATCH ... AGAINST` for searching clients by name/email and pets by name/breed
- **Prisma** is the ORM — define the schema in `prisma/schema.prisma`; use Prisma Migrate for all schema changes; never hand-edit the generated client
- All DB interactions go through a repository layer — no raw SQL in route handlers; use the Prisma client only inside `infrastructure/` — never in `application/` or `domain/`
- **Enums over strings**: all finite-value fields (status, sex, etc.) MUST be defined as `TINYINT` in MySQL migrations with documented value mappings, and as TypeScript `union` types or `enum` in the codebase — never plain `string`
- **No foreign keys**: do NOT define `FOREIGN KEY` constraints in migrations. Referential integrity is enforced at the application layer. Columns that reference other tables are plain `INT` columns with a comment documenting the relationship — denormalized by design

### Docker

- `docker-compose.yml` at repo root for local development
- Services: `app` (frontend dev server), `api` (backend), `db` (MySQL 8)
- Volumes for MySQL data persistence and live code reload
- `.env.example` documents all required environment variables

---

## Domain Model (Core Entities)

```
Client
  id, name, email, phone, phone2, address, status TINYINT (0=inactive, 1=active), created_at, updated_at, deleted_at

Pet
  id, client_id (INT, ref: clients.id), name, species, breed, sex TINYINT (0=unknown, 1=male, 2=female), date_of_birth, weight_kg, notes, status TINYINT (0=inactive, 1=active), created_at, updated_at, deleted_at

Service
  id, name, description, duration_minutes, price, active, status TINYINT (0=inactive, 1=active), created_at, updated_at, deleted_at

Appointment
  id, pet_id (INT, ref: pets.id), service_id (INT, ref: services.id), scheduled_at, status TINYINT (0=pending, 1=confirmed, 2=completed, 3=cancelled),
  notes, created_at, updated_at
```

Full-Text indexes:
- `Client`: `FULLTEXT(name, email)`
- `Pet`: `FULLTEXT(name, breed, notes)`
- `Service`: `FULLTEXT(name, description)`

---

## Testing Strategy

### TDD — Red / Green / Refactor (MANDATORY)

All feature development MUST follow the TDD cycle — no production code is written without a failing test first:

1. **Red** — write a failing test that describes the desired behavior. The test must fail for the right reason (not a syntax error).
2. **Green** — write the minimum production code to make the test pass. No more, no less.
3. **Refactor** — clean up both test and production code without changing behavior. Re-run tests to confirm they still pass.

Rules:
- Never write production code without a failing test driving it
- Never skip the refactor step — it is where design happens
- One failing test at a time — do not batch multiple reds before greening
- If a test is hard to write, it is a design smell — simplify the unit under test

### Unit / Component — Vitest

- Test files live next to source: `src/components/Button/Button.test.tsx`
- Use `@testing-library/react` for component rendering
- Cover: business logic, form validation, data transformations, component behavior
- Do NOT test implementation details (internal state, private methods)
- Run: `npm run test`

### End-to-End — Playwright

- Tests live in `e2e/` at repo root
- Cover: critical user flows (create client, register pet, book appointment, search)
- Use `data-testid` attributes for stable selectors — never CSS class names
- Run: `npm run e2e`

### Coverage

- Target: 80% line coverage for business logic
- Do not chase 100% — test behavior, not lines

---

## Code Conventions

### TypeScript

- Strict mode ON (`"strict": true` in `tsconfig.json`)
- No `any` — use `unknown` and narrow, or define a proper type
- Prefer `interface` for object shapes, `type` for unions and utilities
- Export types explicitly — do not rely on inferred return types for public APIs

### React

- Functional components only — no class components
- Custom hooks for reusable logic, prefixed with `use`
- Keep components small and focused; extract when a component exceeds ~100 lines
- Props interfaces named `{ComponentName}Props`

### Naming

- Files and folders: `PascalCase` for components, `camelCase` for utilities and hooks
- Database columns: `snake_case`
- API response fields: `camelCase` (transform at the repository boundary)
- CSS: Tailwind utilities only — no custom CSS classes unless absolutely necessary

### Imports

- Use absolute imports via Vite path aliases: `@/components/...`, `@/hooks/...`, `@/types/...`
- Group imports: external libs → internal aliases → relative — separated by blank lines

---

## MySQL Full-Text Search Guidelines

- Create `FULLTEXT` indexes in migrations, not ad-hoc
- Use `MATCH(col) AGAINST('term' IN BOOLEAN MODE)` for prefix and phrase matching
- Minimum word length: MySQL default is 4 chars — configure `ft_min_word_len = 2` in `my.cnf` for short pet names
- Wrap FTS queries in the repository layer; never expose raw query strings from the API input directly to `AGAINST()`
- Sanitize FTS input: strip `+`, `-`, `*`, `"`, `(`, `)` before interpolation to prevent FTS operator injection

---

## Docker Development Environment

```bash
# Start all services
docker compose up -d

# Watch logs
docker compose logs -f api

# Run migrations
docker compose exec api npm run migrate

# Teardown (keep volumes)
docker compose stop

# Full reset
docker compose down -v
```

Environment variables are loaded from `.env` (copy `.env.example` and fill in values). Never commit `.env`.

---

## Project Structure (target)

Folder layout follows **DDD bounded contexts** on the backend and **Atomic Design** on the frontend. Each domain is self-contained with its own Clean Architecture layers.

```
pfmaster/
├── src/                                # Frontend (React)
│   ├── components/                     # Atomic Design components
│   │   ├── atoms/
│   │   ├── molecules/
│   │   └── organisms/
│   ├── hooks/                          # Custom React hooks
│   ├── pages/                          # Page-level components (route targets)
│   ├── services/                       # API client functions
│   ├── types/                          # Shared TypeScript interfaces/types
│   └── utils/                          # Pure utility functions
│
├── api/                                # Backend (Node.js + Express)
│   ├── clients/                        # Bounded context: Clients
│   │   ├── domain/                     # Entities, value objects, repo interfaces
│   │   ├── application/                # Use cases
│   │   ├── interface/                  # Controllers, routes, DTOs
│   │   └── infrastructure/             # MySQL repository implementations
│   ├── pets/                           # Bounded context: Pets
│   │   ├── domain/
│   │   ├── application/
│   │   ├── interface/
│   │   └── infrastructure/
│   ├── services/                       # Bounded context: Services (grooming)
│   │   ├── domain/
│   │   ├── application/
│   │   ├── interface/
│   │   └── infrastructure/
│   ├── appointments/                   # Bounded context: Appointments
│   │   ├── domain/
│   │   ├── application/
│   │   ├── interface/
│   │   └── infrastructure/
│   ├── shared/                         # Cross-cutting concerns (no domain logic)
│   │   ├── domain/                     # Base entities, value objects, interfaces
│   │   ├── infrastructure/             # DB connection, base repository, HTTP client
│   │   └── utils/                      # Pure helpers (date, pagination, sanitize)
│   ├── observability/                  # Logging, metrics, tracing
│   │   ├── logger.ts                   # Structured logger (e.g. pino)
│   │   ├── metrics.ts                  # App metrics (request count, latency, etc.)
│   │   └── tracing.ts                  # Distributed tracing hooks (OpenTelemetry)
│   └── db/
│       ├── migrations/                 # SQL migration files
│       └── seeds/                      # Development seed data
│
├── e2e/                                # Playwright end-to-end tests
├── docker/                             # Dockerfile(s) and my.cnf
├── docker-compose.yml
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Key Business Rules

1. A **Pet** must always belong to a **Client** — orphan pets are not allowed
2. A **Service** can be marked `active = false` to retire it without deleting historical appointment records
3. **Appointments** are immutable once `completed` — no edits, only new records
4. Client and Pet **search** must use MySQL FTS — no `LIKE '%term%'` for user-facing search
5. Prices are stored as integers in **cents** (e.g. `2500` = $25.00) to avoid floating-point errors
6. All timestamps stored as UTC; the frontend is responsible for local timezone display

---

## Security

### OWASP Top 10 (MANDATORY)

Every feature and code review MUST check against the OWASP Top 10. Flag any violation as a blocker before merge:

1. **Broken Access Control** — enforce resource ownership checks at the API layer; never trust client-supplied IDs without validation
2. **Cryptographic Failures** — never store sensitive data in plain text; use HTTPS in all environments
3. **Injection** — all DB queries go through the repository layer with parameterized statements; never interpolate raw user input into SQL or FTS queries
4. **Insecure Design** — threat-model new features before implementation; security requirements belong in the spec, not as an afterthought
5. **Security Misconfiguration** — no default credentials, no debug endpoints in production, Docker images use minimal base images
6. **Vulnerable and Outdated Components** — keep dependencies up to date; review `npm audit` output before every release
7. **Identification and Authentication Failures** — even in single-user mode, session tokens must be invalidated on logout and rotated on privilege change
8. **Software and Data Integrity Failures** — verify integrity of third-party scripts and packages; no `eval`, no dynamic `require` with user input
9. **Security Logging and Monitoring Failures** — log authentication attempts, validation errors, and unexpected server errors with enough context to audit
10. **Server-Side Request Forgery (SSRF)** — validate and whitelist any URL or external resource accepted from user input

### Static Analysis & Vulnerability Scanning (MANDATORY)

Two tools are required in the development workflow — neither is optional:

- **SonarQube** — static analysis for code smells, cognitive complexity, duplication, and security hotspots. No PR is merged with unresolved blocker or critical issues reported by SonarQube.
  - Run locally: `docker compose exec sonar sonar-scanner` (or via the SonarQube CI step)
  - Quality Gate must pass before merge — a failing gate is a hard blocker

- **Snyk** — dependency and container vulnerability scanning. Catches known CVEs in `npm` packages and Docker base images.
  - Run: `snyk test` (dependencies) and `snyk container test` (Docker image)
  - Any **critical** or **high** severity finding is a merge blocker; medium findings require a documented exception

Both tools complement each other: SonarQube owns code quality and security hotspots; Snyk owns supply-chain and container risk.

### Code Smells (MANDATORY)

All code — production and test — must be reviewed for the following smells before merge. Any smell found is a refactor trigger, not a style suggestion:

- **Long Method** — a function that does more than one thing; extract until each function has a single clear responsibility
- **Large Class / Component** — a component exceeding ~100 lines or a class with more than one reason to change
- **Duplicate Code** — the same logic in two places is a maintenance bomb; extract to a shared utility or hook
- **Dead Code** — unused variables, functions, imports, or commented-out blocks must be deleted, not left "just in case"
- **Magic Numbers / Strings** — every literal with business meaning must be a named constant or enum value
- **Deep Nesting** — more than two levels of nested conditionals is a readability and logic smell; use early returns or extract functions
- **Primitive Obsession** — avoid passing raw primitives (plain `string`, `number`) where a typed value object or enum conveys intent
- **Feature Envy** — a function that reaches into another module's internals more than its own is in the wrong place
- **Inappropriate Intimacy** — modules that know too much about each other's internals; enforce boundaries through interfaces
- **God Object** — a single module that knows or does everything; split by domain responsibility

## Out of Scope (v1)

- Authentication / multi-user roles (single-user app for now)
- Payment processing
- Email or SMS notifications
- Mobile native app
- File uploads (pet photos)
