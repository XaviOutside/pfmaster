# Verification Report: Create the model Pet in a new API

**Change**: Create the model Pet in a new API.
**Date**: 2026-06-28
**Mode**: Standard
**Branch**: `feat/pet-api-pr11-pages-pt2` (stacked-to-main, all 11 PRs implemented)

---

## 1. Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 35 |
| Tasks complete | 35 |
| Tasks incomplete | 0 |

All 35 tasks (T-01..T-35) are marked `[x]` and corresponding code exists on disk.

---

## 2. Test Results

### Summary

| Suite | Config | Files | Passed | Failed | Skipped |
|-------|--------|-------|--------|--------|---------|
| Backend unit | `vitest.config.ts` (root) | 19 | 146 | 0 | 0 |
| Frontend unit | `vitest.frontend.config.ts` | 21 | 142 | 1 | 0 |
| Integration | `vitest.integration.config.ts` | 2 | 31 | 0 | 0 |
| **Total** | | **42** | **319** | **1** | **0** |

**Pass rate**: 99.7% (319/320)

### Build (TypeScript)

| Target | Result |
|--------|--------|
| `api/` (`npx tsc --noEmit`) | ✅ No errors |
| Frontend (`npx tsc --noEmit`) | ✅ No errors |

### Failing Test

```
FAIL  src/pages/PetEditPage.test.tsx > PetEditPage > renders form pre-populated with pet data
AssertionError: expected HTMLOptionsCollection to have a length of 2 but got 0

 ❯ src/pages/PetEditPage.test.tsx:135:34
    134|     // Client dropdown should show active clients
    135|     expect(clientSelect.options).toHaveLength(2);
```

**Root cause**: Race condition. The test's `waitForFormReady()` resolves when the "Edit Pet" heading appears (after pet data loads), but the PetEditPage client fetch happens asynchronously via `useEffect`. The client options haven't been populated yet when the assertion runs. The component shows a spinner while clients load, so `waitForFormReady` targeting the heading resolves before client data arrives.

**Verdict**: Not a production bug — the component works correctly. The test needs a `waitFor` on client option population.

---

## 3. Spec Compliance Matrix

### Pet Management Backend (FR-1..FR-8b)

| Req | Scenario | Test Evidence | Status |
|-----|----------|---------------|--------|
| FR-1 | Happy path (create with valid client) | `api/pets/interface/PetController.test.ts` > POST 201 | ✅ COMPLIANT |
| FR-1 | Missing name → 422 | `api/pets/application/CreatePet.test.ts` > "name is required" | ✅ COMPLIANT |
| FR-1 | Dead client → 422 | `api/pets/application/CreatePet.test.ts` > client validation | ⚠️ PARTIAL |
| FR-1 | Inactive client → 422 | `api/pets/application/CreatePet.test.ts` > client validation | ⚠️ PARTIAL |
| FR-1 | Nonexistent client → 422 | `api/pets/application/CreatePet.test.ts` > client validation | ⚠️ PARTIAL |
| FR-2 | Found pet → 200 | `api/pets/interface/PetController.test.ts` > GET 200 | ✅ COMPLIANT |
| FR-2 | Not found → 404 | `api/pets/interface/PetController.test.ts` > GET 404 | ✅ COMPLIANT |
| FR-3 | Paginated list | `api/pets/interface/PetController.test.ts` > GET list | ✅ COMPLIANT |
| FR-3 | Inactive excluded | `api/pets/application/ListPets.test.ts` > active-only filter | ✅ COMPLIANT |
| FR-4 | Successful update | `api/pets/interface/PetController.test.ts` > PUT 200 | ✅ COMPLIANT |
| FR-4 | Forbidden status field | `api/pets/interface/PetController.test.ts` > PUT 422 status | ✅ COMPLIANT |
| FR-5 | Deactivate → 200 | `api/pets/interface/PetController.test.ts` > PATCH deactivate | ✅ COMPLIANT |
| FR-6 | Soft-delete → 204 | `api/pets/interface/PetController.test.ts` > DELETE 204 | ✅ COMPLIANT |
| FR-6 | Already deleted → 409 | `api/pets/interface/PetController.test.ts` > DELETE 409 | ✅ COMPLIANT |
| FR-7 | Search match found | `api/pets/interface/PetController.test.ts` > GET /search | ✅ COMPLIANT |
| FR-7 | No match → empty [] | `api/pets/application/SearchPets.test.ts` > empty result | ✅ COMPLIANT |
| FR-7 | Missing q → 400 | `api/pets/interface/PetController.test.ts` > search 400 | ✅ COMPLIANT |
| FR-8 | Cascade deactivate | `api/clients/application/DeactivateClient.test.ts` > cascade | ✅ COMPLIANT |
| FR-8b | Cascade soft-delete | `api/clients/application/SoftDeleteClient.test.ts` > cascade | ✅ COMPLIANT |

**Compliance summary**: 16/19 backend scenarios fully compliant, 3 partial (error message mismatch — see WARNING #2).

### Pet Management Frontend (FR-9..FR-14, loading/error/empty)

| Req | Scenario | Test Evidence | Status |
|-----|----------|---------------|--------|
| FR-9 | List loads with data | `src/pages/PetListPage.test.tsx` > displays pets | ✅ COMPLIANT |
| FR-9 | Empty state + CTA | `src/pages/PetListPage.test.tsx` > empty state | ✅ COMPLIANT |
| FR-9 | Loading spinner | `src/pages/PetListPage.test.tsx` > loading state | ✅ COMPLIANT |
| FR-9 | Search bar with debounce | `SearchBar` component has 300ms `debounceMs` prop | ✅ COMPLIANT |
| FR-10 | View pet detail | `src/pages/PetDetailPage.test.tsx` > renders data | ✅ COMPLIANT |
| FR-10 | Not found message | `src/pages/PetDetailPage.test.tsx` > not-found state | ✅ COMPLIANT |
| FR-11 | Successful creation + redirect | `src/pages/PetCreatePage.test.tsx` > create + redirect | ✅ COMPLIANT |
| FR-11 | Client selector (active only) | `PetForm` filters `c.status === 'active'` | ✅ COMPLIANT |
| FR-12 | Edit pre-populated + save | `src/pages/PetEditPage.test.tsx` > edit + redirect | ✅ COMPLIANT |
| FR-13 | Confirm deactivate modal | `src/pages/PetDetailPage.test.tsx` > deactivate confirm | ✅ COMPLIANT |
| FR-14 | Embedded pets in ClientDetail | `src/pages/ClientDetailPage.test.tsx` > pet list render | ✅ COMPLIANT |
| FR-14 | Client has no pets | `src/pages/ClientDetailPage.test.tsx` > empty state | ✅ COMPLIANT |
| States | API error + retry | `src/pages/PetListPage.test.tsx` > error state | ✅ COMPLIANT |

‼️ **FR-14 embedded pet list is affected by the CRITICAL `client_id` vs `clientId` query param mismatch** — tests pass because they mock `fetch`, but in production the filter will not apply (see Issues).

**Compliance summary**: 13/13 frontend scenarios tested, but 1 critically affected by query param mismatch.

### Client Management Frontend Delta

| Req | Scenario | Test Evidence | Status |
|-----|----------|---------------|--------|
| Delta | Client has pets displayed | `src/pages/ClientDetailPage.test.tsx` > pet section | ✅ COMPLIANT |
| Delta | No pets message + link | `src/pages/ClientDetailPage.test.tsx` > empty | ✅ COMPLIANT |
| Delta | Loading state | `ClientDetailPage` has `petsLoading` spinner | ✅ COMPLIANT |
| Delta | Error state | `ClientDetailPage` has `petsError` display | ✅ COMPLIANT |

---

## 4. Design Compliance

### File Manifest Verification

All ~43 new files from the design exist on disk:

| Path | Status |
|------|--------|
| `api/pets/domain/Pet.ts` | ✅ |
| `api/pets/domain/PetErrors.ts` | ✅ |
| `api/pets/domain/IPetRepository.ts` | ✅ |
| `api/pets/application/CreatePet.ts` + `.test.ts` | ✅ |
| `api/pets/application/GetPet.ts` + `.test.ts` | ✅ |
| `api/pets/application/ListPets.ts` + `.test.ts` | ✅ |
| `api/pets/application/UpdatePet.ts` + `.test.ts` | ✅ |
| `api/pets/application/DeactivatePet.ts` + `.test.ts` | ✅ |
| `api/pets/application/SoftDeletePet.ts` + `.test.ts` | ✅ |
| `api/pets/application/SearchPets.ts` + `.test.ts` | ✅ |
| `api/pets/interface/PetController.ts` + `.test.ts` | ✅ |
| `api/pets/interface/petRouter.ts` | ✅ |
| `api/pets/interface/dtos/CreatePetDto.ts` | ✅ |
| `api/pets/interface/dtos/UpdatePetDto.ts` | ✅ |
| `api/pets/interface/dtos/PetResponseDto.ts` | ✅ |
| `api/pets/infrastructure/PrismaPetRepository.ts` + `.integration.test.ts` | ✅ |
| `src/types/pet.ts` | ✅ |
| `src/shared/types.ts` | ✅ |
| `src/services/pet.ts` + `.test.ts` | ✅ |
| `src/hooks/usePets.ts` + `.test.ts` | ✅ |
| `src/hooks/usePet.ts` + `.test.ts` | ✅ |
| `src/hooks/usePetMutations.ts` + `.test.ts` | ✅ |
| `src/pages/PetListPage.tsx` + `.test.tsx` | ✅ |
| `src/pages/PetCreatePage.tsx` | ✅ |
| `src/pages/PetDetailPage.tsx` + `.test.tsx` | ✅ |
| `src/pages/PetEditPage.tsx` + `.test.tsx` | ✅ |
| `src/components/organisms/PetTable.tsx` | ✅ |
| `src/components/molecules/PetForm.tsx` | ✅ |
| `src/components/organisms/PetDetailCard.tsx` | ✅ |

All 7 modified files confirmed:

| Path | Change | Status |
|------|--------|--------|
| `prisma/schema.prisma` | Added `Pet` model with FULLTEXT index, no FK | ✅ |
| `api/index.ts` | Wired Pet dependencies, passed `petRepository` to cascade | ✅ |
| `api/clients/application/DeactivateClient.ts` | Added `IPetRepository` dep, cascade deactivate | ✅ |
| `api/clients/application/SoftDeleteClient.ts` | Added `IPetRepository` dep, cascade soft-delete | ✅ |
| `src/types/client.ts` | Removed `PaginatedResponse`/`ApiError` (moved to shared) | ✅ |
| `src/services/http.ts` | Updated import to `@/shared/types` | ✅ |
| `src/App.tsx` | Added 4 Pet routes + embedded pet list | ✅ |

### Architecture Rules Verification

| Rule | Check | Status |
|------|-------|--------|
| Domain layer: zero framework/DB imports | `Pet.ts` imports nothing but itself | ✅ |
| Application depends on domain interfaces, not infrastructure | All use cases accept `IPetRepository` interface | ✅ |
| Interface depends on application use cases | `PetController` takes use cases via constructor injection | ✅ |
| Infrastructure implements domain interfaces | `PrismaPetRepository implements IPetRepository` | ✅ |
| No FK constraints in schema | `client_id Int // ref: clients.id — no FK` | ✅ |
| TINYINT enums in schema | `sex Int @db.TinyInt`, `status Int @db.TinyInt` | ✅ |
| FULLTEXT on name, breed, notes | `@@fulltext([name, breed, notes])` | ✅ |
| Constructor injection, `execute()` method | All 7 use cases follow Clients pattern | ✅ |
| `GET /search` before `GET /:id` in router | `petRouter.ts` line 23 has `/search` before line 33 `/:id` | ✅ |
| No `any` types | TypeScript strict mode, no `any` found | ✅ |
| FTS via `$queryRaw` with tagged template | `PrismaPetRepository.search()` uses tagged template | ✅ |
| `sanitizeFtsQuery()` strips operators | Shared utility strips `+ - * " ( )` | ✅ |
| HTTP 500 hides stack trace | `handleError` returns `{ error: 'Internal server error' }` | ✅ |

### Prisma Migration

Migration `20260628162032_add_pet_model` exists. Schema matches design:
- `@db.TinyInt` for `sex` and `status`
- `@db.Decimal(5,2)` for `weightKg`
- `@db.VarChar(255)` for name/breed
- `@db.Text` for notes
- `@@fulltext([name, breed, notes])`
- No `@relation` / FK annotation

---

## 5. Code Quality

### TypeScript
- Backend: `tsc --noEmit` — **0 errors**
- Frontend: `tsc --noEmit` — **0 errors**
- Strict mode enabled: `"strict": true` in both `tsconfig.json` files
- No `any` types detected

### Code Smells
- **Long method**: None detected. All use cases are focused (~15-40 lines each).
- **Deep nesting**: None. Controllers use early returns + try/catch.
- **Magic numbers**: `PET_SEX`, `PET_STATUS`, `DEFAULT_PAGE`, `DEFAULT_LIMIT`, `MAX_LIMIT`, `MAX_NAME_LENGTH`, `MAX_SPECIES_LENGTH` — all named constants.
- **Dead code**: None detected.
- **Duplicate code**: Domain entities share patterns between Clients and Pets, but this is intentional, not unintentional duplication.
- **Primitive obsession**: Sex/status are typed unions, not bare numbers.
- **Feature envy**: None. Each layer stays within its boundary.

### Test Quality
- Use cases: Mock repository, test success + each validation rule
- Controller: Supertest + mocked use cases, test status codes, DTO shape
- Integration: Real Prisma against MySQL, `@integration` tagged
- Frontend: Mock `fetch`, test URL params, method, body, loading/error/empty states

---

## 6. Issues Found

### CRITICAL

1. **`client_id` vs `clientId` query param naming mismatch**
   - **Location**: `src/services/pet.ts:17` vs `api/pets/interface/PetController.ts:139`
   - **What**: The frontend `listPets()` sends `&client_id=10` (snake_case) in the URL query string, but the backend `PetController.listPets()` reads `req.query['clientId']` (camelCase).
   - **Impact**: The embedded pet list on `ClientDetailPage` (`/clients/:id`) will show ALL pets instead of only the pets belonging to that client. The `ClientDetailPage` integration test passes only because it mocks `fetch`.
   - **Evidence**: 
     - Frontend test `src/services/pet.test.ts:75` confirms URL `client_id=10`
     - `PetController.ts:139` reads `req.query['clientId']`
   - **Fix**: Change `src/services/pet.ts:17` from `&client_id=${clientId}` to `&clientId=${clientId}`.

### WARNING

2. **Spec error message mismatch — CreatePet client validation**
   - **Location**: `api/pets/application/CreatePet.ts:31` + `api/pets/infrastructure/PrismaPetRepository.ts:149-160`
   - **What**: The spec requires three distinct error messages for invalid `client_id` scenarios: "client_id references a deleted client", "client_id references an inactive client", and "client_id not found". The implementation returns one generic message: "client_id is not an active client" for all three cases.
   - **Why**: `clientExistsAndIsActive()` returns a `boolean`, making it impossible to distinguish between the three failure modes.
   - **Impact**: The API correctly rejects all invalid clients (422 status), but API consumers cannot distinguish between the error types.
   - **Recommendation**: Either update the spec to accept the generic message, or refactor `clientExistsAndIsActive()` to return a discriminated union.

3. **Frontend test race condition — PetEditPage**
   - **Location**: `src/pages/PetEditPage.test.tsx:135`
   - **What**: Test "renders form pre-populated with pet data" fails because `waitForFormReady()` resolves before client options are loaded asynchronously.
   - **Fix**: Add a `waitFor` on `clientSelect.options.length > 0` before the assertion, or use `findByRole` with a populated option.

### SUGGESTION

4. **Search bypasses `usePets` hook in PetListPage**
   - **Location**: `src/pages/PetListPage.tsx:66-68`
   - **What**: The PetListPage manages search state independently and calls `searchPets()` directly, bypassing the `usePets` hook entirely. This means search and pagination are disconnected — the search view has no pagination support.
   - **Impact**: Minor for V1; becomes more visible as pet count grows.
   - **Recommendation**: Consider integrating search into `usePets` hook in a future iteration.

---

## 7. Verdict

**FAIL**

Despite an impressive 99.7% test pass rate and comprehensive spec coverage, the `client_id`/`clientId` query parameter mismatch is a functional bug that breaks the embedded pet list on `ClientDetailPage` in production. This is a blocker for archive readiness.

The fix is a one-line change (`src/services/pet.ts:17`), after which the change should be re-verified.

### Required actions before archive:
1. 🔴 **Fix CRITICAL #1**: `src/services/pet.ts:17` — change `&client_id=` to `&clientId=`
2. 🟡 **Fix WARNING #3**: `src/pages/PetEditPage.test.tsx:135` — add `waitFor` on client options
3. 🟡 **Address WARNING #2**: Either update spec or refactor client validation error messages
4. Re-run full test suite after fix
