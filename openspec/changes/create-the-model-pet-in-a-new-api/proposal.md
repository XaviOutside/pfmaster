# Proposal: Create the model Pet in a new API.

## Intent

Add full CRUD + search for Pets as a top-level REST resource (`/api/v1/pets`), following the established Clients Clean Architecture pattern. The frontend gets dedicated pet pages plus an embedded pet list inside the client detail view.

## Scope

### In scope
- Prisma `Pet` model with FTS indexes (`name`, `breed`, `notes`) and enum TINYINT fields
- Backend Pets bounded context: domain entity/errors/repo-interface, 7 use cases, controller, router, Prisma repo
- 7 REST endpoints: create, get, list, update, deactivate, soft-delete, search
- Frontend: `PetListPage`, `PetDetailPage`, `PetCreatePage`, `PetEditPage`
- Frontend components: `PetTable`, `PetForm`, `PetDetailCard`
- Frontend: `usePets`, `usePet`, `usePetMutations` hooks + `api/pets` service
- Types: `src/types/pet.ts`; extract `PaginatedResponse`/`ApiError` to `src/shared/`
- Embedded pet list section in `ClientDetailPage`
- Client → Pet cascade at application layer: deactivate client → deactivate pets; soft-delete client → soft-delete pets
- `CreatePet` validates `client_id` references an active, non-deleted client
- Full tests: unit (use cases, controller, hooks, services), integration (repository vs real DB), frontend pages

### Out of scope
- Appointments, Services (future domains)
- Authentication / multi-user
- Nested URL routing (`/clients/:clientId/pets` as API path)

### Non-goals
- Mobile-specific optimization
- Pet photos / file uploads

## Approach

Replicate the Clients bounded context identically — every layer, file, naming convention, test pattern. Backend: Clean Architecture + DDD. Frontend: Atomic Design.

## Key decisions

| Decision | Rationale |
|----------|-----------|
| `/api/v1/pets` standalone (not nested under clients) | User confirmed top-level resource |
| Cascade deactivate/delete at application layer | No FK constraints per project rules; referential integrity in use cases |
| Frontend: `/pets/*` standalone + embedded list in `/clients/:id` | Dedicated pet management + context-aware client view |
| Search: global across all pets | Not scoped to a single client; user confirmed |
| Extract shared types to `src/shared/` | DRY — avoid duplicating `PaginatedResponse`/`ApiError` |

## Capabilities

### New Capabilities
- `pet-management-backend`: Pet domain entity, 7 use cases (CRUD, search, deactivate, soft-delete, cascade), controller, router, Prisma repository, Pet model + migration. Route at `/api/v1/pets`.
- `pet-management-frontend`: Pet pages, components, hooks, services, types. Routes at `/pets`, `/pets/:id`, `/pets/new`, `/pets/:id/edit`.

### Modified Capabilities
- `client-management-frontend`: Add embedded pet list section to `ClientDetailPage` at `/clients/:id`.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Orphan pets if cascade skipped | Medium | Integration test verifying cascade; use case-level enforcement |
| Route order `/search` vs `/:id` | Low | Copy Clients router pattern (commented order guard) |
| Shared type extraction breaks Client imports | Low | Update all Client imports in same PR; TypeScript catches misses |
| Integration test data interference with Clients tests | Low | `singleFork: true`; delete pets before clients in cleanup |

## Rollback

1. Remove `Pet` model from Prisma schema; run `prisma migrate dev --create-only` for revert migration; regenerate client
2. Remove `/api/v1/pets` wiring from `api/index.ts`
3. Git revert frontend files

## Dependencies

- Clients bounded context (`client_id` references `clients.id`; cascade on delete)
- Reuses: `sanitizeFtsQuery`, Prisma singleton, `StatusBadge`, `Button`, `Input`, `Select`, `Modal`, `SearchBar`, `Pagination`, `ConfirmDialog`

## Success criteria

- [ ] All 7 Pet API endpoints return correct status codes and DTO shapes
- [ ] `CreatePet` rejects invalid/missing `client_id` with 422
- [ ] Soft-deleting a client cascade-soft-deletes all its pets
- [ ] Deactivating a client cascade-deactivates all its pets
- [ ] Pet FTS search returns matches across name, breed, and notes
- [ ] `PetListPage` renders paginated table with loading/empty/error states
- [ ] `PetDetailPage` shows all pet fields with edit/deactivate actions
- [ ] `ClientDetailPage` shows embedded pet list scoped to that client
- [ ] All tests pass: unit coverage ≥ 80% on `api/pets/`, integration pass against real DB, frontend pages pass
