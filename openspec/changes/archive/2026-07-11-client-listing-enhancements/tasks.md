# Tasks: Client Listing Enhancements

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~195 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | ask-always |
| Suggested split | Single PR — well under 400-line budget |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 5 deliverables | PR 1 | ~195 lines across 12 files; single PR feasible |

---

## Phase 1: Database Foundation

- [x] 1.1 Add `lastServiceDate DateTime? @map("last_service_date") @db.Date` to Client model in `prisma/schema.prisma`. Run `prisma migrate dev --name add_last_service_date_to_client`. (~1 line + migration)

## Phase 2: Backend Data Pipeline

- [x] 2.1 Add `lastServiceDate: Date | null` to `Client` interface in `api/clients/domain/Client.ts`. (~1 line)
- [x] 2.2 Add `lastServiceDate` to `PrismaClientRepository`: `mapToClient` row type + return, `search()` `$queryRaw` SELECT + inline mapping. Covers both `findAll` and FTS read paths. (~8 lines)
- [x] 2.3 RED: Add `lastServiceDate: null` to `expectedDto` in `api/clients/interface/ClientController.test.ts`. GREEN: Add `lastServiceDate: string | null` to `ClientResponseDto` interface + `toClientResponseDto` mapper using `?.toISOString().slice(0, 10) ?? null`. Verify: `npm test`. (~5 lines code + ~2 lines test)

## Phase 3: Frontend Foundation

- [x] 3.1 Add `lastServiceDate: string | null` to `Client` interface in `src/types/client.ts`. (~1 line)
- [x] 3.2 RED: Create `src/utils/format.test.ts` — test `formatServiceDate` valid date → "DD/MM/YYYY", null → "—". GREEN: Implement `formatServiceDate(dateStr: string | null): string` in `src/utils/format.ts`. Verify: `npm run test:frontend`. (~10 lines code + ~40 lines test)
- [x] 3.3 Change `gap-3` → `gap-4` on line 185 in `src/components/organisms/DataTable.tsx`. (~1 line)

## Phase 4: Core UI — ClientsPage 4-Column Layout

- [x] 4.1 RED: Create `src/pages/ClientsPage.test.tsx` — mock `useClients`, render `<ClientsPage>`, assert: bold name, muted `#ID`, 4th column "Último servicio" with DD/MM/YYYY format, conditional phone2/address rendering. Verify: `npm run test:frontend` must FAIL. (~80 lines)
- [x] 4.2 GREEN: Update `src/pages/ClientsPage.tsx` — import `formatServiceDate`, add 4th column (`header: "Último servicio"`, `span: sm:col-span-3`), change first column render to `<span className="font-semibold">` name + `<span className="text-sm text-on-surface-variant">` `#{id}`, add phone2/address conditional rows to contact column, adjust spans to 3-3-2-3-1 grid. Verify: `npm run test:frontend` must PASS. (~30 lines)

## Phase 5: Existing Test Fixtures

- [x] 5.1 Add `lastServiceDate: null` to each entry in `mockClients` array in `src/hooks/useClients.test.ts`. Verify: `npm run test:frontend`. (~4 lines)
- [x] 5.2 Add `lastServiceDate: null` to `domainClient` fixture in `api/clients/interface/ClientController.test.ts`. Verify: `npm test`. (~1 line)

## Phase 6: Full Validation

- [x] 6.1 Run `npm test && npm run test:frontend && npm run lint && npm run build` — all must pass with 0 errors.

---

**Files affected**: 12 (8 code + 4 test, including 2 new test files).
**Test commands**: `npm test` (API), `npm run test:frontend` (frontend).
**Fixture-breaking tasks**: 2.3 (API fixture), 5.1 (hook fixture), 5.2 (API controller fixture). Update fixtures BEFORE running full suite.
