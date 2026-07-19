# Proposal: Appointment Calendar System

## Intent

Add appointment scheduling with a weekly calendar. The Sidebar's "New Appointment" button and `/calendar` link are currently inert — users cannot record or visualize grooming appointments. This delivers the first operational scheduling feature.

## Scope

### In Scope
- Appointment CRUD API: domain, use cases, repository, `/api/v1/appointments`
- MySQL `appointments` table: `pet_id`, `client_id` (denormalized), `scheduled_at`, `status` (TINYINT: 0=pending 1=confirmed 2=completed 3=cancelled), `notes` (free-text service), timestamps
- Double-booking prevention: same pet + same `scheduled_at` → 409 Conflict
- Weekly calendar at `/calendar` — custom Tailwind CSS grid, Mon–Sun pagination from current week
- "New Appointment" modal: client FTS search → pet dropdown → datetime picker (native inputs) → notes
- Business hours from CompanySettings for time grid display

### Out of Scope
- Service catalog FK — `notes` is free-text only
- Drag-and-drop, recurring appointments, multi-user, notifications

## Capabilities

### New Capabilities
- `appointment-backend`: Entity, status enum, `IAppointmentRepository`, CRUD use cases with double-booking check, week-filtered listing, Prisma repo, routes
- `appointment-calendar-frontend`: Custom CSS Grid weekly calendar, week navigation, AppointmentCard, modal form with client FTS + pet filter, DateTimePicker molecule

### Modified Capabilities
- `i18n-infrastructure`: New `appointments` namespace — calendar, day names, status, validation (en + es)

## Approach

**Custom Tailwind CSS calendar** — zero external deps. CSS Grid 7-column layout, pure `Date` functions in `src/utils/calendar.ts` for week math. DateTimePicker uses native `<input type="date">` + `<select>` constrained to business hours. `client_id` denormalized from `pet_id` to avoid JOINs in calendar listings.

## Affected Areas

| Area | Impact |
|------|--------|
| `prisma/schema.prisma` | Modified — Appointment model |
| `api/appointments/` (domain→infra) | **New** — full bounded context |
| `api/index.ts`, `api/db/migrations/` | Modified + **New** — wiring, table |
| `api/shared/domain/errors.ts` | Modified — add ConflictError |
| `src/App.tsx` | Modified — `/calendar` route |
| `src/pages/AppointmentsPage.tsx` | **New** — calendar page + modal state |
| `src/components/organisms/` | **New** — CalendarWeek, AppointmentCard, AppointmentModal |
| `src/components/molecules/` | **New** — DateTimePicker, ClientSearch, AppointmentForm |
| `src/{services,types,utils}/` | **New** — API client, types, calendar utils |
| `src/locales/{en,es}/` | **New** + Modified — appointments namespace |
| `src/components/organisms/Sidebar.tsx` | Modified — wire button → modal trigger |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unconfigured business hours | Medium | Fallback 8–18 Mon–Fri |
| Denormalized `client_id` drift | Low | Set on create, never mutate |
| Custom calendar a11y gaps | Medium | ARIA grid roles, keyboard nav, screen-reader labels |

## Rollback Plan

Remove `/calendar` route → sidebar link inert (pre-existing). Drop appointments migration (reversible). Remove `api/appointments/` wiring.

## Dependencies

- CompanySettings exposes `workdays`, `workStartTime`, `workEndTime` via `GET /api/v1/settings`
- Client FTS search and pet-by-client endpoints reused, not modified

## Success Criteria

- [ ] Create appointment via modal → appears on calendar at correct day/hour
- [ ] Double-booking same pet+date+hour returns 409 Conflict
- [ ] Week pagination navigates Mon–Sun, starting from current week
- [ ] Calendar respects CompanySettings workdays/hours (fallback 8–18 Mon–Fri)
- [ ] Client FTS search filters pet dropdown by selected client
- [ ] All user-facing strings have en + es translations
