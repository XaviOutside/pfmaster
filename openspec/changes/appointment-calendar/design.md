# Design: Appointment Calendar System

## Technical Approach

Custom Tailwind CSS weekly calendar + modal appointment form. Backend adds a new `appointments` bounded context following the existing Clean Architecture pattern (domain → application → interface → infrastructure). Frontend uses CSS Grid for the 7-column calendar with hourly time slots, native `<input type="date">` + `<select>` for date/time, and reuses existing `searchClients` API + `listPets` for the modal form. Zero new UI dependencies.

## Architecture Decisions

| # | Decision | Option | Tradeoff | Choice |
|---|---|---|---|---|
| D1 | Week query | `GET /appointments?start=ISO&end=ISO` | vs. `GET /appointments/week?offset=N`. Date range decouples backend from week semantics; frontend computes boundaries from current week offset. | Date range — simpler, reusable for non-week views |
| D2 | client_id denormalization | Store on CREATE, never mutate | vs. JOIN on every read. Storage cost is trivial; avoids JOIN for calendar listings which show pet+client names. Risk: drift if pet is reassigned (v1 pets are immutable per business rules). | Denormalize — 1 INT column vs per-request JOIN |
| D3 | Calendar time grid | CSS Grid, hourly rows (8–18), day columns | vs. `<table>` (verbose), vs. absolute positioning (brittle). Grid maps naturally to the 7×N layout; `grid-row` span per appointment for multi-hour. | CSS Grid — semantic, responsive, testable |
| D4 | DateTimePicker | Native `<input type="date">` + `<select>` (30-min increments) | vs. `react-datepicker` (+200KB dep). Native inputs handle a11y, localization, validation for free. Tradeoff: less visual polish. | Native — zero deps, tests with standard RTL |
| D5 | Modal state | React `useState` in AppointmentsPage | vs. global store. Single component owns the modal; no shared state needed. Lift only if another page triggers the modal later. | Local state — YAGNI |
| D6 | Double-booking | Application-layer check: `SELECT 1 FROM appointments WHERE pet_id=? AND scheduled_at=?` before INSERT | vs. UNIQUE index on (pet_id, scheduled_at). EXACT match on DateTime is too strict — users might want same pet at slightly different times. Application check allows future tolerance rules. | Application check with ConflictError(409) |
| D7 | ConflictError | Add to `api/shared/domain/errors.ts` as shared error (like NotFoundError) | vs. context-specific error. Conflict (409) is a standard HTTP status used across contexts (double-booking, already-deleted, etc.). | Shared — consistent with AlreadyDeletedError pattern |

## Data Flow

```
User clicks "New Appointment" in Sidebar
  → AppointmentsPage sets isModalOpen=true
    → AppointmentModal renders
      → ClientSearch: user types → debounced searchClients(q)
        → Pick a client → listPets(clientId) → filtered pet dropdown
      → DateTimePicker: native inputs, constrained to business hours
      → Notes textarea (max 500 chars)
      → Submit → POST /api/v1/appointments
        → AppointmentController → CreateAppointmentUseCase
          → pet exists? client exists? → double-booking check
          → PrismaAppointmentRepository.create()
        → 201 + AppointmentResponseDto
      → Modal closes, calendar refetches week range
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `Appointment` model (pet_id, client_id, scheduled_at, status TINYINT, notes, timestamps) |
| `api/shared/domain/errors.ts` | Modify | Add `ConflictError` class (extends Error, name='ConflictError') |
| `api/appointments/domain/*` | Create | Appointment entity, AppointmentStatus enum, IAppointmentRepository, CreateAppointmentInput |
| `api/appointments/application/*` | Create | CreateAppointment, ListAppointments, GetAppointment, UpdateAppointment, CancelAppointment use cases |
| `api/appointments/interface/*` | Create | AppointmentController, appointmentRouter, DTOs |
| `api/appointments/infrastructure/PrismaAppointmentRepository.ts` | Create | Prisma CRUD, date-range query, double-booking check |
| `api/index.ts` | Modify | Wire appointments bounded context — imports, instantiation, mount at `/api/v1/appointments` |
| `src/App.tsx` | Modify | Add `<Route path="/calendar" element={<AppointmentsPage />} />` under DashboardLayout |
| `src/pages/AppointmentsPage.tsx` | Create | Calendar page: modal state, week nav, settings fetch, appointment list fetch |
| `src/components/organisms/CalendarWeek.tsx` | Create | CSS Grid calendar: 7 columns (Mon–Sun), hourly rows 8–18, AppointmentCard slots |
| `src/components/organisms/AppointmentCard.tsx` | Create | Card in calendar grid slot showing pet name, client name, time, status badge |
| `src/components/organisms/AppointmentModal.tsx` | Create | Modal form: ClientSearch + pet filter + DateTimePicker + notes → POST |
| `src/components/molecules/DateTimePicker.tsx` | Create | `<input type="date">` + `<select>` with 30-min slots constrained to business hours |
| `src/components/molecules/ClientSearch.tsx` | Create | Debounced FTS input → searchClients() → client picker |
| `src/components/organisms/Sidebar.tsx` | Modify | Wire "New Appointment" button onClick → callback from AppointmentsPage |
| `src/services/appointment.ts` | Create | API client: createAppointment, listAppointments(dateRange), getAppointment |
| `src/types/appointment.ts` | Create | Appointment, CreateAppointmentDto, AppointmentStatus types |
| `src/utils/calendar.ts` | Create | getWeekStart, getWeekEnd, addWeeks, getTimeSlots — pure Date functions |
| `src/locales/{en,es}/appointments.json` | Create | i18n keys: calendar, day names, status labels, form labels, validation |

## Interfaces / Contracts

```typescript
// Domain
type AppointmentStatus = 0 | 1 | 2 | 3; // pending | confirmed | completed | cancelled

interface CreateAppointmentInput {
  petId: number;
  clientId: number;        // denormalized from pet
  scheduledAt: Date;       // UTC
  notes?: string;          // max 500 chars
}

// GET /api/v1/appointments?start=ISO&end=ISO
// Response: AppointmentResponseDto[]
interface AppointmentResponseDto {
  id: number;
  petId: number;
  petName: string;         // joined from pets table
  clientId: number;
  clientName: string;      // joined from clients table
  scheduledAt: string;     // ISO 8601
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  createdAt: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (domain) | AppointmentStatus values, CreateAppointmentInput validation | Vitest — pure function tests, no DB |
| Unit (application) | CreateAppointmentUseCase: double-booking rejection, pet/client existence checks | Mocked IAppointmentRepository |
| Integration (infra) | PrismaAppointmentRepository: create, findByDateRange, existsByPetAndTime | Test DB (Docker) with seeded data |
| Integration (interface) | Controller: POST 201, 400/404/409 errors, GET with date range | Supertest against Express app |
| Unit (frontend) | DateTimePicker: time slot generation, business-hour constraint | RTL + Vitest |
| Unit (frontend) | calendar.ts: getWeekStart, getWeekEnd, addWeeks across month/year boundaries | Vitest |
| Component | CalendarWeek: renders 7 columns, correct day labels, Appointments in correct slots | RTL with mocked data |
| Component | AppointmentModal: form flow — search client → pick pet → submit | RTL with mocked API |
| E2E | Full flow: navigate to /calendar, open modal, create appointment, see it on calendar | Playwright |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

One new migration for `appointments` table. No existing data to migrate. Rollback: drop migration + remove `/calendar` route + remove `api/appointments/` wiring.

## Open Questions

None — all decisions resolved in the architecture decisions table above.
