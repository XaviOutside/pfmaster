# Design: Create the model Pet in a new API

## 1. Architecture Overview

Pets is a new DDD bounded context at `/api/v1/pets`, mirroring Clients identically in Clean Architecture layers (domain → application → interface → infrastructure). It depends on Clients for `client_id` validation and cascade operations. Frontend routes `/pets/*` standalone, plus an embedded pet list inside `ClientDetailPage`.

## 2. Data Model

### 2.1 Prisma Schema

```prisma
model Pet {
  id          Int       @id @default(autoincrement())
  client_id   Int       // ref: clients.id — no FK
  name        String    @db.VarChar(255)
  species     String    @db.VarChar(100)
  breed       String    @db.VarChar(255)
  sex         Int       @db.TinyInt @default(0) // 0=unknown, 1=male, 2=female
  dateOfBirth DateTime? @map("date_of_birth") @db.Date
  weightKg    Decimal?  @map("weight_kg") @db.Decimal(5, 2)
  notes       String?   @db.Text
  status      Int       @db.TinyInt @default(1) // 0=inactive, 1=active
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  @@fulltext([name, breed, notes])
  @@map("pets")
}
```

### 2.2 Migration

`prisma migrate dev` generates a single migration adding the `pets` table with `TINYINT` columns, `FULLTEXT` index, and no FK. `client_id` is a plain `INT` with a comment.

### 2.3 Domain Types & Enums

| DB Column | DB Type | Domain Type | DTO Type |
|-----------|---------|-------------|----------|
| sex | TINYINT(0/1/2) | `PetSex = 0 \| 1 \| 2` + `PET_SEX` const | `'unknown' \| 'male' \| 'female'` |
| status | TINYINT(0/1) | `PetStatus = 0 \| 1` + `PET_STATUS` const | `'active' \| 'inactive'` |
| date_of_birth | DATE NULL | `Date \| null` | `string \| null` (ISO 8601) |
| weight_kg | DECIMAL(5,2) NULL | `number \| null` | `number \| null` |

## 3. Backend — Layer Design

All layers replicate Clients conventions exactly: constructor injection, `execute()` method, domain errors, `@api/*` path aliases.

### 3.1 Domain Layer (`api/pets/domain/`)

- **`Pet.ts`** — Entity interface `Pet`, enums (`PetStatus`/`PetSex` with `as const` objects), `CreatePetInput` (required: `client_id`, `name`, `species`, `breed`; optional: `sex`, `date_of_birth`, `weight_kg`, `notes`), `UpdatePetInput` (all optional except `status` for internal use).
- **`PetErrors.ts`** — `PetNotFoundError`, `PetAlreadyDeletedError`, `PetValidationError` (mirrors `ClientErrors.ts`).
- **`IPetRepository.ts`** — Methods: `create`, `findById`, `findAll`, `findAllByClientId(clientId, page, limit)`, `update`, `softDelete`, `search`, `clientExistsAndIsActive(clientId)`, `deactivateAllByClientId(clientId)`, `softDeleteAllByClientId(clientId)`.

### 3.2 Application Layer — Use Cases (`api/pets/application/`)

| Use Case | Key Logic |
|----------|-----------|
| `CreatePet` | Validates required fields + email. Calls `clientExistsAndIsActive(client_id)` → throws `PetValidationError` if client invalid. Delegates to `repository.create()` |
| `GetPet` | `findById` → `NotFoundError` if null or deleted. Returns `Pet` |
| `ListPets` | Pagination (defaults: page=1, limit=20, max=100). Accepts optional `client_id` filter |
| `UpdatePet` | Fetches existing, validates not deleted, strips `status` from DTO, calls `repository.update()` |
| `DeactivatePet` | Fetches, sets `status: PET_STATUS.INACTIVE` via `repository.update()` |
| `SoftDeletePet` | Fetches, validates not already deleted, calls `repository.softDelete()` |
| `SearchPets` | Sanitizes query via shared `sanitizeFtsQuery()`, delegates to `repository.search()` (global search across name/breed/notes) |

### 3.3 Interface Layer (`api/pets/interface/`)

- **`PetController`** — 7 handler methods. Reuses `parsePositiveInt()` and `handleError()` pattern. `handleError` maps `PetNotFoundError→404`, `PetValidationError→422`, `PetAlreadyDeletedError→409`. `PUT /:id` blocks `status` field. `POST /` maps `CreatePetDto` → use case input. `GET /search` requires `?q=` parameter.
- **`petRouter`** — Factory `createPetRouter(controller): Router`. Route order: `POST /`, `GET /`, `GET /search` (before `/:id`), `GET /:id`, `PUT /:id`, `PATCH /:id/deactivate`, `DELETE /:id`.
- **DTOs**: `CreatePetDto`, `UpdatePetDto`, `PetResponseDto` with `toPetResponseDto()` mapping TINYINT→string, Date→ISO8601, `deletedAt` omitted.

### 3.4 Infrastructure (`api/pets/infrastructure/`)

- **`PrismaPetRepository`** — Implements `IPetRepository`. `mapToPet()` casts `number` → union types. `search()` uses `$queryRaw` with tagged template for FTS. `findAllByClientId()` adds `where: { client_id, deletedAt: null }`. `clientExistsAndIsActive()` does a lightweight `findFirst` on clients table. `deactivateAllByClientId`/`softDeleteAllByClientId` use `updateMany` filtered by `client_id`.
- **`api/index.ts` wiring** — Add Pet imports + `app.use('/api/v1/pets', createPetRouter(petController))`. Place **after** clients block, **before** 404 handler.

### 3.5 Cascade Modifications to Clients

`DeactivateClientUseCase` and `SoftDeleteClientUseCase` gain an `IPetRepository` constructor parameter. After deactivating/deleting the client, they call `deactivateAllByClientId` / `softDeleteAllByClientId` respectively. `api/index.ts` passes `petRepository` to those use cases.

## 4. Frontend Design

### 4.1 Routing (`src/App.tsx`)

```
/pets              → PetListPage
/pets/new          → PetCreatePage
/pets/:id          → PetDetailPage
/pets/:id/edit     → PetEditPage
```

`ClientDetailPage` gains an embedded `<PetTable clientId={id} />` section below the client card. Controlled via a `clientId` prop — when set, the hook fetches `GET /api/v1/pets?client_id={id}`.

### 4.2 Component Tree (Atomic Design)

- **Atoms (reuse)**: `Button`, `Input`, `Select`, `Spinner`, `Badge`, `Modal`
- **Molecules (reuse)**: `SearchBar`, `Pagination`, `ConfirmDialog`, `StatusBadge`
- **New organisms**: `PetTable` (paginated table with search), `PetDetailCard` (field display + actions), `PetForm` (create/edit form with client_id dropdown — fetches active clients)

### 4.3 Hooks

| Hook | Pattern | Returns |
|------|---------|---------|
| `usePets(clientId?)` | Matches `useClients` | `{ pets, isLoading, error, search, fetchPets }` |
| `usePet(id?)` | Matches `useClient` | `{ pet, isLoading, error, refetch }` |
| `usePetMutations` | Matches `useClientMutations` | `{ useCreatePet, useUpdatePet, useDeletePet, useDeactivatePet }` |

### 4.4 API Services (`src/services/pet.ts`)

Seven functions matching `client.ts`: `listPets(page?, limit?, clientId?)`, `getPet(id)`, `createPet(data)`, `updatePet(id, data)`, `deletePet(id)`, `deactivatePet(id)`, `searchPets(query)`.

### 4.5 Shared Types Extraction

Move `PaginatedResponse<T>` and `ApiError` from `src/types/client.ts` → `src/shared/types.ts`. Update `src/services/http.ts` import from `@/types/client` → `@/shared/types`. Update all Client imports. `src/types/pet.ts` imports shared types from `@/shared/types`.

## 5. Testing Strategy

| Layer | Config | Approach |
|-------|--------|----------|
| Use cases (7 files) | `vitest.config.ts` | Mock `IPetRepository` via `vi.fn()`. Test success + each validation rule |
| Controller | `vitest.config.ts` | Supertest + mocked use cases. Test status codes, DTO shape, error mapping |
| Repository integration | `vitest.integration.config.ts` | Real PrismaClientRepository against MySQL. `@integration` tag. Cleanup via `prisma.pet.deleteMany()` before clients |
| Frontend services | `vitest.frontend.config.ts` | `vi.stubGlobal('fetch')`. Test URL params, method, body |
| Frontend hooks | `vitest.frontend.config.ts` | RenderHook with mocked services |
| Frontend pages | `vitest.frontend.config.ts` | `@testing-library/react` + mocked fetch. Loading/empty/error/data states |
| E2E | Playwright | Not in scope this change |

## 6. File Manifest

### New files (~43)

| Path | Purpose |
|------|---------|
| `api/pets/domain/Pet.ts` | Entity, enums, input types |
| `api/pets/domain/PetErrors.ts` | Domain error classes |
| `api/pets/domain/IPetRepository.ts` | Repository interface |
| `api/pets/application/CreatePet.ts` + `.test.ts` | Create use case + test |
| `api/pets/application/GetPet.ts` + `.test.ts` | Get by ID use case + test |
| `api/pets/application/ListPets.ts` + `.test.ts` | Paginated list + test |
| `api/pets/application/UpdatePet.ts` + `.test.ts` | Partial update + test |
| `api/pets/application/DeactivatePet.ts` + `.test.ts` | Status change + test |
| `api/pets/application/SoftDeletePet.ts` + `.test.ts` | Soft-delete + test |
| `api/pets/application/SearchPets.ts` + `.test.ts` | FTS search + test |
| `api/pets/interface/PetController.ts` + `.test.ts` | 7 handlers + test |
| `api/pets/interface/petRouter.ts` | Express router factory |
| `api/pets/interface/dtos/CreatePetDto.ts` | POST request DTO |
| `api/pets/interface/dtos/UpdatePetDto.ts` | PUT request DTO |
| `api/pets/interface/dtos/PetResponseDto.ts` | Response DTO + mapper |
| `api/pets/infrastructure/PrismaPetRepository.ts` + `.integration.test.ts` | Prisma implementation + integration test |
| `src/types/pet.ts` | Frontend Pet types |
| `src/shared/types.ts` | Extracted `PaginatedResponse`, `ApiError` |
| `src/services/pet.ts` + `.test.ts` | 7 API functions + test |
| `src/hooks/usePets.ts` + `.test.ts` | Pet list hook + test |
| `src/hooks/usePet.ts` + `.test.ts` | Single pet hook + test |
| `src/hooks/usePetMutations.ts` + `.test.ts` | Mutation hooks + test |
| `src/pages/PetListPage.tsx` + `.test.tsx` | Pet list page + test |
| `src/pages/PetCreatePage.tsx` | Create form page |
| `src/pages/PetDetailPage.tsx` | Detail view page |
| `src/pages/PetEditPage.tsx` | Edit form page |
| `src/components/organisms/PetTable.tsx` | Table organism |
| `src/components/molecules/PetForm.tsx` | Form molecule |
| `src/components/organisms/PetDetailCard.tsx` | Detail card organism |

### Modified files (~4)

| Path | Change |
|------|--------|
| `prisma/schema.prisma` | Add `Pet` model |
| `api/index.ts` | Wire Pet dependencies, pass `petRepository` to cascade use cases |
| `api/clients/application/DeactivateClient.ts` | Add `IPetRepository` dependency + cascade |
| `api/clients/application/SoftDeleteClient.ts` | Add `IPetRepository` dependency + cascade |
| `src/types/client.ts` | Remove `PaginatedResponse`/`ApiError` (moved to shared) |
| `src/services/http.ts` | Update import to `@/shared/types` |
| `src/App.tsx` | Add 4 Pet routes + embedded pet list in `ClientDetailPage` |

## 7. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Client cascade | Modify DeactivateClient/SoftDeleteClient use cases with IPetRepository dep | Ensures atomic consistency; no FK constraints per project rules |
| client_id validation | `clientExistsAndIsActive()` on IPetRepository, implemented via Prisma query to clients table | Keeps domain layer pure (no cross-context imports); repository abstracts the check |
| ListPets client filter | Optional `client_id` query param on `GET /api/v1/pets` | Reuses list endpoint for both global list and embedded client-detail list |
| Shared types | Extract to `src/shared/types.ts` | DRY; PaginatedResponse/ApiError are domain-agnostic |
| FTS on notes | Include in `@@fulltext` index, `LIMIT 50` on search | Matches Clients pattern; Notes is `@db.Text` — acceptable for small-to-medium shops |

## 8. Open Questions

None — all decisions resolved in proposal.
