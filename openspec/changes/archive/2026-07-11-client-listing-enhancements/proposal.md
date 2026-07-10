# Proposal: Client Listing Enhancements

## Intent

Enrich the client listing with bold name hierarchy, client ID, expanded contact details (phone2, address), and a read-only last-service date — data already in the domain or trivially added.

## Scope

### In Scope
- **Name styling**: bold name + muted client ID below, wider gap from avatar
- **Contact expansion**: render `phone2` and `address` (already in domain, not displayed)
- **last_service_date**: add `lastServiceDate: Date | null` across DB, domain, repo, DTO, and frontend type; display DD/MM/YYYY
- **DB migration**: Prisma schema update + `last_service_date DATE NULL`
- **Tests**: update frontend + API unit tests (strict TDD)

### Out of Scope
- Client detail page changes
- Editing `lastServiceDate` via forms (read-only)
- Computing `lastServiceDate` from appointments (appointment context not implemented)

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `client-management-frontend`: listing column layout and content changed

## Approach

**Frontend** — 4 columns in `ClientsPage.tsx`:
1. "Cliente": bold name + muted `#ID` below; existing `avatarName` prop + wider `gap-4`
2. "Contacto": add `phone2` and `address` below existing email + phone
3. "Estado": unchanged
4. "Último servicio": `lastServiceDate` as DD/MM/YYYY or "—"

**Backend** — `lastServiceDate` through all layers:
1. `prisma/schema.prisma`: add `lastServiceDate DateTime? @map("last_service_date") @db.Date`
2. Migration: `npx prisma migrate dev --name add_last_service_date_to_client`
3. Domain `Client`: add `lastServiceDate: Date | null`
4. `PrismaClientRepository.mapToClient` + raw FTS query: include field
5. `ClientResponseDto`: emit as ISO string or null
6. Frontend `Client` type: add `lastServiceDate: string | null`

No new routes — list/search endpoints auto-include the field via DTO mapper.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/ClientsPage.tsx` | Modified | 4-column layout |
| `src/types/client.ts` | Modified | Add `lastServiceDate` |
| `api/clients/domain/Client.ts` | Modified | Add `lastServiceDate` |
| `api/clients/infrastructure/PrismaClientRepository.ts` | Modified | Map column in all read paths |
| `api/clients/interface/dtos/ClientResponseDto.ts` | Modified | Emit new field |
| `prisma/schema.prisma` | Modified | Add column |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing tests fail from DTO change | Medium | Update fixtures; run full suite after change |
| FTS raw query omits new column | Low | Add `last_service_date` to `$queryRaw` SELECT list |
| DB migration error in Docker | Low | Nullable column, no data migration; test locally first |

## Rollback Plan

Revert migration (drop column), revert code in 6 files, confirm tests pass.

## Dependencies

None.

## Success Criteria

- [ ] Bold client name with avatar gap; muted ID below name
- [ ] Contact column shows phone, phone2, email, address
- [ ] `lastServiceDate` column in DB; displays as DD/MM/YYYY in listing
- [ ] All existing tests pass; new tests cover rendered fields
