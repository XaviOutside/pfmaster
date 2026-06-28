# Exploration Report: Create the model Pet in a new API

## 1. Existing Pet Coverage

**Zero.** There is no Pet-related code anywhere in the codebase:

- ❌ No `api/pets/` bounded context directory
- ❌ No `model Pet` in `prisma/schema.prisma`
- ❌ No `Pet` types in `src/types/`
- ❌ No Pet-related pages, components, hooks, or services in `src/`
- ❌ No Pet-related test files
- ❌ No migration files for pets (`api/db/migrations/` doesn't even exist yet)
- ❌ No Pet routes in `api/index.ts`
- ❌ No Pet route in `src/App.tsx`

The only Pet references are in **documentation** (`AGENTS.md` domain model section), which describes the intended schema — but nothing has been implemented.

## 2. Prisma Schema — Current State

Only one model exists: `Client` (26 lines total).

**Client model structure:**
```prisma
model Client {
  id        Int       @id @default(autoincrement())
  name      String    @db.VarChar(255)
  email     String    @db.VarChar(255)
  phone     String    @db.VarChar(50)
  phone2    String?   @db.VarChar(50)
  address   String?   @db.VarChar(255)
  status    Int       @db.TinyInt @default(1) // 0=inactive, 1=active
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@fulltext([name, email])
  @@map("clients")
}
```

**Key conventions observed:**
- Surrogate PK: `id Int @id @default(autoincrement())`
- Enum fields use `Int @db.TinyInt` with inline comments documenting values
- Timestamps: `DateTime @default(now()) @map("created_at")`, `DateTime @updatedAt @map("updated_at")`
- Soft-delete: `DateTime? @map("deleted_at")`
- String fields use `@db.VarChar(N)` with appropriate lengths
- FTS index: `@@fulltext([col1, col2])`
- Table mapping: `@@map("table_name")` (snake_case)
- Prisma field names: camelCase; DB column names: snake_case (via `@map`)
- No `@relation` or foreign keys — denormalized by design (per AGENTS.md)
- Generator: `fullTextSearch` and `fullTextIndex` preview features enabled

**Pet model needed:** Based on the `AGENTS.md` domain model description:
```
Pet: id, client_id (INT, ref: clients.id), name, species, breed, sex TINYINT (0=unknown, 1=male, 2=female),
     date_of_birth, weight_kg, notes, status TINYINT (0=inactive, 1=active),
     created_at, updated_at, deleted_at
```
FTS: `@@fulltext([name, breed, notes])`

## 3. Clients Bounded Context — Template Analysis

The Clients bounded context is the **authoritative template** — Pets must follow the identical patterns.

### 3.1 Domain Layer (`api/clients/domain/`)

| File | Purpose | Key Patterns |
|------|---------|-------------|
| `Client.ts` | Entity + input types + enum constants | `type ClientStatus = 0 \| 1` (union type with `as const` constants object). `interface Client` for domain entity. `interface CreateClientInput`, `interface UpdateClientInput` for use case inputs |
| `ClientErrors.ts` | Domain-specific error classes | Extends `Error`. Each error has a descriptive name (e.g., `ClientNotFoundError`). Constructor takes relevant params |
| `IClientRepository.ts` | Repository interface | Pure domain types only. Methods: `create()`, `findById()`, `findAll()`, `update()`, `softDelete()`, `search()`. No Prisma or Express imports |

**Domain entity conventions:**
- Enum fields typed as numeric union + `as const` constants object
- `CreateClientInput` omits auto-generated fields (id, timestamps, status)
- `UpdateClientInput` makes all fields optional; status excluded except for internal use
- All date fields: `Date` type (not string)
- `deletedAt: Date | null` for soft-delete

### 3.2 Application Layer (`api/clients/application/`)

| File | Pattern |
|------|---------|
| `CreateClient.ts` | Validates required fields, enforces business rules, delegates to repository |
| `GetClient.ts` | Fetches by ID, throws `NotFoundError` if null or soft-deleted |
| `ListClients.ts` | Pagination with defaults (page=1, limit=20, max=100), validates params |
| `UpdateClient.ts` | Fetches existing, validates not deleted, strips status from update data |
| `DeactivateClient.ts` | Fetches existing, sets status=INACTIVE via update |
| `SoftDeleteClient.ts` | Fetches existing, validates not already deleted, calls `repository.softDelete()` |
| `SearchClients.ts` | Sanitizes FTS query via `sanitizeFtsQuery()`, delegates to `repository.search()` |

**Key patterns:**
- Constructor injection: `constructor(private readonly repository: IClientRepository)`
- Single `execute()` method per use case
- Domain errors thrown for business rule violations
- Input validation happens here (not in controller)
- Use cases never import framework or DB code — only domain imports + shared utils
- Test files co-located: `CreateClient.test.ts` next to `CreateClient.ts`

### 3.3 Interface Layer (`api/clients/interface/`)

| File | Purpose |
|------|---------|
| `ClientController.ts` | Express controller class. Constructor takes all 7 use cases. Each method: parse params, call use case, map to DTO, handle errors |
| `clientRouter.ts` | Factory function `createClientRouter(controller)`. Returns Express Router. Route order: `/search` before `/:id`. 7 routes total |
| `dtos/ClientResponseDto.ts` | Interface + mapping function: `toClientResponseDto(client: Client)`. Converts TINYINT→string, Date→ISO8601, omits deletedAt |
| `dtos/CreateClientDto.ts` | Request DTO interface: defines shape of POST body |
| `dtos/UpdateClientDto.ts` | Request DTO interface: all fields optional, status excluded |

**Controller conventions:**
- `parsePositiveInt()` helper validates `:id` — rejects non-numeric, zero, negative, floats
- `handleError()` maps domain errors to HTTP: `NotFoundError→404`, `ValidationError→422`, `AlreadyDeletedError→409`, unknown→500 (no stack in body)
- Status field explicitly blocked in PUT (only PATCH `/deactivate` can change it)
- Search requires `?q=` parameter, returns 400 if missing

**Router conventions:**
- Factory function pattern: `export function createClientRouter(controller): Router`
- No inline logic — delegates entirely to controller methods
- Commented route order notes: `/search` before `/:id`

**DTO conventions:**
- Response DTO: status as `'active' | 'inactive'` (human-readable, not TINYINT)
- Dates as ISO 8601 strings (`toISOString()`)
- `deletedAt` intentionally omitted from response
- Mapping function exported alongside interface

### 3.4 Infrastructure Layer (`api/clients/infrastructure/`)

| File | Purpose |
|------|---------|
| `PrismaClientRepository.ts` | Implements `IClientRepository` using Prisma. Maps Prisma model ↔ domain Client |
| `PrismaClientRepository.integration.test.ts` | Real DB tests — creates/reads/updates/deletes/searches against MySQL |

**Repository conventions:**
- Imports `prisma` singleton from `@api/shared/infrastructure/prisma`
- All reads filter `deletedAt: null` (soft-delete enforcement)
- `$queryRaw` with tagged template for FTS search (parameterized, not string interpolation)
- `mapToClient()` private method converts Prisma row → domain Client
- `search()` uses raw SQL for FTS `MATCH ... AGAINST() IN BOOLEAN MODE` with `LIMIT 50`
- Domain entity types only in return types

## 4. API Route Structure

**Entry point:** `api/index.ts`

```typescript
// Wiring pattern for Clients:
const clientRepository = new PrismaClientRepository();
const clientController = new ClientController(
  new CreateClientUseCase(clientRepository),
  new GetClientUseCase(clientRepository),
  // ... all 7 use cases
);
app.use('/api/v1/clients', createClientRouter(clientController));
```

**URL convention:** `/api/v1/{resource-plural}`

**Middleware applied globally:**
- `express.json()` — JSON body parsing
- Request logging via pino logger
- Health check at `GET /health`

**Pets will follow the same pattern:**
```typescript
app.use('/api/v1/pets', createPetRouter(petController));
```

**Shared infrastructure:**
- `api/shared/infrastructure/prisma.ts` — PrismaClient singleton with HMR guard
- `api/shared/utils/sanitizeFtsQuery.ts` — FTS operator stripping (shared, can be reused)
- `api/shared/domain/BaseEntity.ts` — `{ id, createdAt, updatedAt }` interface (currently unused by Client, but available)
- `api/observability/logger.ts` — pino logger singleton

## 5. Frontend Pet Coverage

**Zero.** The frontend currently has only Client-related code:

| Layer | Clients (exists) | Pets (needed) |
|-------|-----------------|---------------|
| `src/types/` | `client.ts` (Client, ClientStatus, CreateClientDto, UpdateClientDto, PaginatedResponse, ApiError) | `pet.ts` — mirror with Pet-specific fields |
| `src/services/` | `client.ts` (7 API functions), `http.ts` (shared fetch wrapper) | `pet.ts` — 7 API functions following same pattern |
| `src/hooks/` | `useClients.ts`, `useClient.ts`, `useClientMutations.ts` (with tests) | `usePets.ts`, `usePet.ts`, `usePetMutations.ts` |
| `src/pages/` | `ClientListPage`, `ClientCreatePage`, `ClientDetailPage`, `ClientEditPage` (with tests) | `PetListPage`, `PetCreatePage`, `PetDetailPage`, `PetEditPage` |
| `src/components/` | ClientTable, ClientForm, ClientDetailCard, StatusBadge, SearchBar, Pagination, ConfirmDialog (atoms, molecules, organisms) | PetTable, PetForm, PetDetailCard (can reuse atoms + molecules) |
| `src/App.tsx` | 4 Client routes via react-router-dom v7 | 4 Pet routes (nested under clients or standalone) |

**Shared/reusable components:**
- Atoms: `Button`, `Input`, `Select`, `Spinner`, `Badge`, `Modal` — all reusable
- Molecules: `SearchBar`, `Pagination`, `ConfirmDialog`, `StatusBadge` — reusable
- `http.ts` fetch wrapper with `/api/v1` base — already shared, no change needed
- `PaginatedResponse<T>` and `ApiError` types in `src/types/client.ts` — should move to a shared types file or be duplicated cleanly

## 6. Testing Patterns to Replicate

Three Vitest configs with strict separation:

| Config | Scope | Environment | Command |
|--------|-------|-------------|---------|
| `vitest.config.ts` | `api/**/*.test.ts` (unit) | node | `npm run test` |
| `vitest.integration.config.ts` | `api/**/*.integration.test.ts` | node (singleFork, sequential) | `npm run test:integration` |
| `vitest.frontend.config.ts` | `src/**/*.test.{ts,tsx}` | jsdom | `npm run test:frontend` |

### 6.1 Use Case Unit Tests (e.g., `CreateClient.test.ts`)

```typescript
// Pattern:
- Mock repository via vi.fn() for all methods
- Factory function makeRepository() creates fresh mock per test
- beforeEach: create mock + instantiate use case
- Test: success case (returns entity)
- Test: each validation rule (throws domain error)
- Test: repository NOT called when validation fails
```

### 6.2 Controller Tests (e.g., `ClientController.test.ts`)

```typescript
// Pattern:
- Uses supertest + express for HTTP-level testing
- Mock use cases as `{ execute: vi.fn() } as unknown as SomeUseCase`
- makeApp() creates fresh Express app with router mounted
- beforeEach: vi.clearAllMocks()
- Test: status codes (201, 200, 204, 400, 404, 422, 409, 500)
- Test: DTO shape (toMatchObject, not.toHaveProperty('deletedAt'))
- Test: error messages in response body
- Test: no stack trace in 500 responses
```

### 6.3 Integration Tests (e.g., `PrismaClientRepository.integration.test.ts`)

```typescript
// Pattern:
- @integration tag in JSDoc
- Real PrismaClientRepository (no mocking)
- seedClient() helper for test setup
- Track createdIds[], cleanup in afterEach via prisma.client.deleteMany()
- Test: create returns entity with id/timestamps
- Test: findById returns null for non-existent and soft-deleted
- Test: findAll respects pagination and excludes deleted
- Test: softDelete sets deletedAt, findById returns null after
- Test: search via FTS returns matches, excludes deleted
```

### 6.4 Frontend Service Tests (e.g., `client.test.ts`)

```typescript
// Pattern:
- vi.stubGlobal('fetch', mockFetch) — mock global fetch
- beforeEach: mockFetch.mockReset()
- Mock response: { ok, status, json: () => Promise.resolve(data) }
- Test: query params in URL, method in options, response body shape
- Test: network error handling
```

### 6.5 Frontend Page Tests (e.g., `ClientListPage.test.tsx`)

```typescript
// Pattern:
- @testing-library/react render + screen
- BrowserRouter wrapper
- vi.stubGlobal('fetch', mockFetch) for API calls
- afterEach(cleanup)
- Test: loading state (spinner visible)
- Test: data rendering (screen.getByText for data)
- Test: empty state
- Test: error state
- Test: navigation buttons
```

## 7. Database Migration Conventions

**No migration files exist yet** (`api/db/migrations/` directory is absent).

Migrations will be created via: `npm run migrate` → `prisma migrate dev`

Based on the Prisma schema patterns and AGENTS.md:

- **Migration naming:** Prisma auto-generates timestamped names (e.g., `20250101000000_create_pets`)
- **SQL generated by Prisma** — no hand-written SQL migrations
- **Column types:** `TINYINT` for enums (status, sex), `VARCHAR(N)` for strings, `INT` for IDs
- **No FK constraints** — `client_id` will be a plain `INT` column with a comment documenting the reference
- **FTS indexes:** Prisma generates `CREATE FULLTEXT INDEX` via `@@fulltext` attribute
- **MySQL FTS config:** `ft_min_word_len = 2` configured in `docker/my.cnf` (for short pet names)
- **Soft-delete:** `deleted_at DATETIME NULL` — no physical deletes, enforced by repository layer
- **UTC timestamps:** All `DATETIME` columns store UTC

## 8. DTO & Enum Conventions

### Response DTO Mapping

```typescript
// Pattern: to{EntityName}ResponseDto(entity: DomainEntity): ResponseDto
export function toClientResponseDto(client: Client): ClientResponseDto {
  return {
    id: client.id,
    // ... passthrough fields ...
    status: client.status === 1 ? 'active' : 'inactive',  // TINYINT → string
    createdAt: client.createdAt.toISOString(),              // Date → ISO 8601
    updatedAt: client.updatedAt.toISOString(),
    // deletedAt intentionally OMITTED
  };
}
```

### Enum Handling

**Domain layer** (API internal):
```typescript
export type ClientStatus = 0 | 1;
export const CLIENT_STATUS = { INACTIVE: 0, ACTIVE: 1 } as const;
```

**Interface layer** (DTO / API response):
```typescript
status: 'active' | 'inactive';  // human-readable string
```

**Frontend types** (mirrors DTO):
```typescript
export type ClientStatus = 'active' | 'inactive';
```

**For Pets — domain model from AGENTS.md:**

| Field | DB Type | Domain Type | DTO Type |
|-------|---------|-------------|----------|
| sex | TINYINT (0=unknown, 1=male, 2=female) | `0 \| 1 \| 2` + `PET_SEX` const | `'unknown' \| 'male' \| 'female'` |
| status | TINYINT (0=inactive, 1=active) | `0 \| 1` + `PET_STATUS` const | `'active' \| 'inactive'` |
| date_of_birth | DATE | `Date \| null` | `string \| null` (ISO 8601) |
| weight_kg | DECIMAL(5,2) | `number \| null` | `number \| null` |

## 9. Implementation Scope Estimate

### Backend (Clean Architecture, ~25 files)

**Prisma schema (`prisma/schema.prisma`):**
- Add `Pet` model (1 change, ~12 lines)

**Domain layer (`api/pets/domain/`):**
- `Pet.ts` — entity, enums, input types (~45 lines)
- `PetErrors.ts` — error classes (~15 lines)
- `IPetRepository.ts` — repository interface (~15 lines)

**Application layer (`api/pets/application/`):**
- `CreatePet.ts` — validate + create (~30 lines)
- `GetPet.ts` — find by id (~20 lines)
- `ListPets.ts` — paginated list, optionally filter by client_id (~30 lines)
- `UpdatePet.ts` — partial update (~30 lines)
- `DeactivatePet.ts` — status change (~20 lines)
- `SoftDeletePet.ts` — soft delete (~20 lines)
- `SearchPets.ts` — FTS search (~20 lines)
- Tests: ~7 test files (~80-120 lines each)

**Interface layer (`api/pets/interface/`):**
- `PetController.ts` — 7 handler methods (~180 lines)
- `petRouter.ts` — route factory (~50 lines)
- `dtos/PetResponseDto.ts` — interface + mapping fn (~40 lines)
- `dtos/CreatePetDto.ts` (~15 lines)
- `dtos/UpdatePetDto.ts` (~20 lines)
- `PetController.test.ts` (~250 lines)

**Infrastructure layer (`api/pets/infrastructure/`):**
- `PrismaPetRepository.ts` — Prisma implementation (~130 lines)
- `PrismaPetRepository.integration.test.ts` (~180 lines)

**API entry point (`api/index.ts`):**
- Wire Pet dependencies + mount router (~15 lines added)

### Frontend (Atomic Design, ~16 files)

**Types/Services/Hooks:**
- `src/types/pet.ts` — Pet types (~35 lines)
- `src/services/pet.ts` — 7 API functions (~55 lines)
- `src/hooks/usePets.ts` (~100 lines)
- `src/hooks/usePet.ts` (~55 lines)
- `src/hooks/usePetMutations.ts` (~70 lines)
- Tests: ~4 test files

**Pages:**
- `src/pages/PetListPage.tsx` (~180 lines)
- `src/pages/PetCreatePage.tsx` (~100 lines)
- `src/pages/PetDetailPage.tsx` (~80 lines)
- `src/pages/PetEditPage.tsx` (~100 lines)
- Tests: ~2 page test files

**Components (new domain-specific organisms/molecules):**
- `src/components/organisms/PetTable.tsx` (~80 lines)
- `src/components/molecules/PetForm.tsx` (~90 lines)
- `src/components/organisms/PetDetailCard.tsx` (~60 lines)

**Routing (`src/App.tsx`):**
- Add 4 Pet routes (~8 lines)

### Migration
- 1 Prisma migration generated via `prisma migrate dev`

### Total Estimated Artifacts: ~40-45 files

| Layer | Files | Approx. Lines |
|-------|-------|---------------|
| Prisma schema | 1 change | +12 |
| API domain | 3 | ~75 |
| API application | 14 (7 src + 7 test) | ~900 |
| API interface | 6 (5 src + 1 test) | ~555 |
| API infrastructure | 2 (1 src + 1 test) | ~310 |
| API entry point | 1 change | +15 |
| Frontend types/services | 2 | ~90 |
| Frontend hooks | 6 (3 src + 3 test) | ~425 |
| Frontend pages | 6 (4 src + 2 test) | ~620 |
| Frontend components | 3 | ~230 |
| Frontend routing | 1 change | +8 |
| **Total** | **~45** | **~3,240** |

**Complexity: Medium** — the pattern is well-established from Clients, but the volume is significant and the Pet model has more fields/enums than Client.

## 10. Risks & Gotchas

### Architectural Risks
1. **Pet ↔ Client relationship enforcement** — Pets require a `client_id` that must reference a valid, non-deleted Client. This is enforced at the application layer (no FK constraints per project rules). The CreatePet use case MUST verify the client exists and is active before creating the pet.
2. **Orphan pets on client deletion** — When a Client is soft-deleted, should pets be cascade-deactivated? The current AGENTS.md doesn't specify. This needs clarification.
3. **FTS on notes** — The `notes` field is included in the FULLTEXT index, but `notes` is `text` type (potentially large). MySQL FTS on large text fields has performance implications.

### Convention Gotchas
4. **Path aliases differ by runtime** — `@api/*` works in the backend (tsconfig paths + vitest resolve.alias), but `@/*` is configured differently in Vite vs TypeScript. Backend uses `@api/*` for its own imports; frontend uses `@/*` for `src/*`.
5. **Prisma enum mapping** — `status` in the DB is `Int @db.TinyInt`, but Prisma's TypeScript types will infer it as `number`. The repository's `mapToPet()` MUST cast to the literal union type (`0 | 1` or `0 | 1 | 2`).
6. **DTO status mapping** — `toPetResponseDto()` must handle all 3 sex enum values (0→unknown, 1→male, 2→female) and must not crash on unexpected values (defensive mapping).
7. **FTS query sanitization** — Pets search must use the same `sanitizeFtsQuery()` utility. It's already shared in `api/shared/utils/`, so no new code needed — just import it.
8. **Route order** — `/search` MUST be declared before `/:id` in the router, or "search" will be matched as an `:id` parameter and fail `parsePositiveInt()`.
9. **Integration test cleanup** — Pet integration tests need `prisma.pet.deleteMany()` cleanup, but must handle the fact that pets reference clients. Delete pets before clients in cleanup.
10. **Frontend route nesting** — Pets are a sub-resource of Clients. The URL structure should be `/clients/:clientId/pets` or `/pets`. This is an architectural decision that needs to be made before implementation.

### Testing Risks
11. **Coverage thresholds** — `vitest.config.ts` enforces 80% line coverage on `api/**/*.ts`. New Pet files must maintain this.
12. **Integration test DB setup** — Integration tests require Docker MySQL running. The `singleFork: true` config means Pet and Client integration tests share the same DB worker, which could cause data interference if not careful with cleanup.

### Frontend Risks
13. **Shared types file** — `src/types/client.ts` defines `ApiError` and `PaginatedResponse<T>` which are generic and should be shared with Pets. Options: (a) create `src/types/common.ts`, (b) duplicate. Duplication is simpler but violates DRY. Moving requires updating all Client imports.
14. **react-router-dom v7** — The project uses v7, which may have API differences from v6. Check that nested route patterns (e.g., `/clients/:clientId/pets/:petId`) work correctly.
15. **StatusBadge component** — Currently shows "active"/"inactive" for clients. For pets, it needs to also show status + sex. Could parameterize or create a Pet-specific variant.

### Missing Prerequisites
16. **No migrations exist** — First `prisma migrate dev` will generate the initial migration for both Client AND Pet models. The Client table might need to be created fresh, or a baseline migration needs to be set up.
17. **Prisma client regeneration** — After adding the Pet model, `prisma generate` must be run to update the Prisma Client types. This affects all dev workflows.

## Ready for Proposal

**Yes.** The Clients bounded context provides a complete, well-tested template. Every layer, pattern, convention, and testing approach is clearly established. The main decisions needed before spec:

1. **URL structure**: `/api/v1/pets` (standalone) or nested under clients?
2. **Pet-Client lifecycle**: What happens to pets when a client is deactivated/deleted?
3. **Frontend routing**: `/pets` (global list) or `/clients/:id/pets` (per-client)?
4. **Search scope**: Global search across all pets or scoped to a specific client?
5. **Shared types extraction**: Move `ApiError`/`PaginatedResponse` to `src/types/common.ts` or duplicate?
