# Design: Client Listing Enhancements

## Technical Approach

Five deliverables across frontend + backend, centered on enriching the `ClientsPage` listing (served at `/clients`). The `lastServiceDate` field flows through all Clean Architecture layers — Prisma schema → domain entity → repository mapper → DTO → frontend type → render. Frontend changes are scoped to column definitions in `ClientsPage.tsx` and a shared gap tweak in `DataTable.tsx`. No new routes, no new components — the existing `ColumnConfig<T>` + `DataTable` abstractions carry all the new content.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Gap widening: `gap-3` → `gap-4` | Modify the hardcoded `gap-3` in DataTable.tsx to `gap-4` | All three pages using `avatarName` (Clients, Pets, Services) get consistent 16px spacing. No prop-drilling needed for a shared design token. |
| Name column: bold + muted ID | Render a React Fragment (`<>...</>`) in the first column's `render` function — `<span className="font-semibold">` for name, `<span className="text-sm text-on-surface-variant">` for `#ID` | Keeps DataTable generic. No component extraction needed for a 2-line cell. |
| Date formatting: DD/MM/YYYY | New utility `formatServiceDate(dateStr: string \| null): string` in `src/utils/format.ts` | Testable, reusable. Returns `"DD/MM/YYYY"` or `"—"` (em dash). Separated from existing `formatDate` which outputs long-month format. |

## Data Flow

```
DB: last_service_date (DATE NULL)
  │
  ▼
Prisma Client model → PrismaClientRepository.mapToClient() / search()
  │  Row fields: last_service_date → Date | null
  ▼
Domain Client: lastServiceDate: Date | null
  │
  ▼
ClientResponseDto.toClientResponseDto()
  │  client.lastServiceDate ? client.lastServiceDate.toISOString().slice(0, 10) : null
  ▼
GET /api/v1/clients → { ..., lastServiceDate: "2026-06-15" | null }
  │
  ▼
Frontend Client type: lastServiceDate: string | null
  │
  ▼
ClientsPage column 4 render → formatServiceDate(c.lastServiceDate) → "15/06/2026" | "—"
```

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `lastServiceDate DateTime? @map("last_service_date") @db.Date` to Client model |
| `api/clients/domain/Client.ts` | Modify | Add `lastServiceDate: Date \| null` to Client interface |
| `api/clients/infrastructure/PrismaClientRepository.ts` | Modify | Add field to `mapToClient` row type + mapping; add `last_service_date` to `search()` `$queryRaw` — update both the generic type parameter and the inline row mapping |
| `api/clients/interface/dtos/ClientResponseDto.ts` | Modify | Add `lastServiceDate: string \| null` to interface and `toClientResponseDto` mapper |
| `src/types/client.ts` | Modify | Add `lastServiceDate: string \| null` to Client interface |
| `src/pages/ClientsPage.tsx` | Modify | 4-column layout: bold name + `#ID`, expanded contact, new "Último servicio" column |
| `src/components/organisms/DataTable.tsx` | Modify | Change `gap-3` → `gap-4` in first-column avatar row (line 185) |
| `src/utils/format.ts` | Create | Add `formatServiceDate(dateStr: string \| null): string` |
| `api/clients/interface/ClientController.test.ts` | Modify | Add `lastServiceDate: null` to `domainClient` and `expectedDto` fixtures |
| `src/hooks/useClients.test.ts` | Modify | Add `lastServiceDate: null` to `mockClients` fixtures |
| `src/pages/ClientsPage.test.tsx` | Create | Render with mock API, assert bold name, `#ID`, contact fields, formatted date |

> **Note**: `src/pages/ClientListPage.tsx` and its test are legacy dead code (not routed in `App.tsx`). They are out of scope for this change and intentionally excluded from the File Changes table.

## Column Layout (Desktop)

```
sm:grid-cols-12 grid:
┌────────────┬────────────┬──────────┬────────────┬──────┐
│  Cliente   │  Contacto  │  Estado  │Últ. serv. │ Acts │
│ sm:col-3   │ sm:col-3   │sm:col-2  │ sm:col-3   │ col-1│
├────────────┼────────────┼──────────┼────────────┼──────┤
│ [AV] Name  │ ✉ email    │ Active ● │ 15/06/2026 │ 👁 ✎ │
│     #42    │ ☎ phone    │          │            │      │
│            │ ☎ phone2   │          │            │      │
│            │ ⌂ address  │          │            │      │
└────────────┴────────────┴──────────┴────────────┴──────┘
```

## Migration Strategy

```bash
npx prisma migrate dev --name add_last_service_date_to_client
```

- Column: `last_service_date DATE NULL` — no data migration, no downtime
- Rollback: `prisma migrate diff` to generate rollback SQL (`ALTER TABLE clients DROP COLUMN last_service_date`), or `prisma migrate reset` in dev

## Data Population

- **Initial state**: all `last_service_date` values start as `NULL` (migration default)
- **Population mechanism**: deferred to a follow-up SDD change — this change only provides the storage + display pipeline
- **No data migration** required at this stage

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| **API unit** | DTO maps `lastServiceDate` | Update `expectedDto` fixture in `ClientController.test.ts`; test null path |
| **Frontend unit** | `formatServiceDate` outputs DD/MM/YYYY and `—` | New test cases in `src/utils/format.test.ts` |
| **Frontend page** | ClientsPage renders 4 columns with correct content | New `ClientsPage.test.tsx`: render with mock API, assert bold name, `#ID`, contact fields, formatted date |
| **Existing tests** | All pass after fixture updates | Update `mockClients` in `useClients.test.ts`; update `domainClient`/`expectedDto` in API tests |

## CSS Decisions

- **Bold name**: `font-semibold` (matches spec: bold weight) — not `font-bold` to keep hierarchy readable
- **Muted ID**: `text-sm text-on-surface-variant` — Material 3 token for secondary/de-emphasized text
- **Avatar gap**: `gap-4` (16px) — changed in DataTable.tsx, affects all listing pages consistently
- **Contact icon rows**: Existing `flex items-center gap-2` with `material-symbols-outlined text-[16px]` — extend pattern for phone2 (☎) and address (⌂/location_on). **Conditional rendering** required: `{c.phone2 && (<span>...</span>)}` and `{c.address && (<span>...</span>)}` — these are nullable fields that must only render when a value exists.

## Open Questions

- [ ] Should the `lastServiceDate` column be sortable? (Out of scope for this change, but worth noting for future)
