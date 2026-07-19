# Tasks: Appointment Calendar System

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1650–1950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Backend domain + schema + ConflictError | PR 1 | `npx vitest run api/appointments/domain/ api/shared/domain/errors.test.ts` | `docker compose exec api npx prisma migrate status` | Remove `api/appointments/domain/`, revert `prisma/schema.prisma` and `api/shared/domain/errors.ts`, drop migration |
| 2 | Backend repository + use cases | PR 2 | `npx vitest run --config vitest.config.ts api/appointments/application/` | `docker compose exec api npm test` (full API unit suite) | Remove `api/appointments/application/` and `api/appointments/infrastructure/` |
| 3 | Backend interface + API wiring | PR 3 | `npx vitest run --config vitest.config.ts api/appointments/interface/` | `curl localhost:3000/api/v1/appointments?start=2026-07-20&end=2026-07-26` | Remove `api/appointments/interface/`, revert `api/index.ts` additions |
| 4 | Frontend i18n + types + services + utils | PR 4 | `npx vitest run --config vitest.frontend.config.ts src/utils/calendar.test.ts src/services/` | `npm run dev` → check `/calendar` loads without crash | Remove `src/locales/*/appointments.json`, `src/types/appointment.ts`, `src/services/appointment.ts`, `src/utils/calendar.ts`, revert `src/i18n.ts` |

## Phase 1: Backend Domain & Schema

- [x] 1.1 TDD-RED: Write `Appointment.test.ts` — default status=0, denormalized client_id from pet
- [x] 1.2 TDD-GREEN: Create `api/appointments/domain/Appointment.ts` — entity with `AppointmentStatus` union type (0|1|2|3), `CreateAppointmentInput` interface, status defaults to 0
- [x] 1.3 Create `api/appointments/domain/AppointmentErrors.ts` — `AppointmentNotFoundError`, `AppointmentValidationError`, `AppointmentConflictError` extending shared errors
- [x] 1.4 Create `api/appointments/domain/IAppointmentRepository.ts` — interface: `create`, `findById`, `findByDateRange`, `existsByPetAndTime`, `update`
- [x] 1.5 Add `ConflictError` to `api/shared/domain/errors.ts` — extends Error, name='ConflictError'
- [x] 1.6 Add `ConflictError` test to `api/shared/domain/errors.test.ts`
- [x] 1.7 Add `Appointment` model to `prisma/schema.prisma` — pet_id, client_id, scheduled_at, status TINYINT, notes VARCHAR 500, timestamps. `@@map("appointments")`
- [x] 1.8 Run `npx prisma migrate dev --name add_appointments` to generate migration

## Phase 2: Backend Business Logic (Repository + Use Cases)

- [x] 2.1 TDD-RED: Write `CreateAppointment.test.ts` — success (201), double-booking (409), notes >500 chars (422), pet not found (404)
- [x] 2.2 TDD-GREEN: Create `api/appointments/application/CreateAppointment.ts` — validate pet exists via `IPetRepository`, check `existsByPetAndTime`, set status=0, create
- [x] 2.3 TDD-RED: Write `GetAppointment.test.ts` — existing id returns entity, missing id throws AppointmentNotFoundError
- [x] 2.4 TDD-GREEN: Create `api/appointments/application/GetAppointment.ts` — `findById` with not-found guard
- [x] 2.5 TDD-RED: Write `ListAppointments.test.ts` — date range filter returns correct subset, empty range returns []
- [x] 2.6 TDD-GREEN: Create `api/appointments/application/ListAppointments.ts` — `findByDateRange(start, end)`, ordered ascending by scheduled_at
- [x] 2.7 TDD-RED: Write `UpdateAppointment.test.ts` — cancel (→status=3 OK), edit completed (→422), status transitions
- [x] 2.8 TDD-GREEN: Create `api/appointments/application/UpdateAppointment.ts` — reject completed edits (status=2→any), allow pending↔confirmed, any→cancelled
- [x] 2.9 Create `api/appointments/infrastructure/PrismaAppointmentRepository.ts` — implement `IAppointmentRepository`: create, findById, findByDateRange, existsByPetAndTime, update. Join pet/client names in `findByDateRange`
- [x] 2.10 Write `PrismaAppointmentRepository.integration.test.ts` — create + findByDateRange against test DB

## Phase 3: Backend API Surface (Interface + Wiring)

- [x] 3.1 Create `api/appointments/interface/dtos/CreateAppointmentDto.ts` — petId, scheduledAt (ISO string), notes? (max 500)
- [x] 3.2 Create `api/appointments/interface/dtos/AppointmentResponseDto.ts` — id, petId, petName, clientId, clientName, scheduledAt, status, notes, createdAt. Include `toAppointmentResponseDto()` mapper
- [x] 3.3 TDD-RED: Write `AppointmentResponseDto.test.ts` — mapper transforms entity to DTO with string status
- [x] 3.4 TDD-GREEN: Implement `toAppointmentResponseDto()` mapper
- [x] 3.5 TDD-RED: Write `AppointmentController.test.ts` — POST 201/400/409/422, GET /:id 200/404, GET ?start&end 200, PATCH status transitions
- [x] 3.6 TDD-GREEN: Create `api/appointments/interface/AppointmentController.ts` — `createAppointment(req, res)`, `getAppointment(req, res)`, `listAppointments(req, res)`, `updateAppointment(req, res)`. Parse positive int :id, map domain errors → HTTP status
- [x] 3.7 Create `api/appointments/interface/appointmentRouter.ts` — `POST /`, `GET /`, `GET /:id`, `PATCH /:id`. Use `express.Router()` pattern matching existing routers
- [x] 3.8 Wire appointments context in `api/index.ts` — instantiate `PrismaAppointmentRepository`, all use cases, `AppointmentController`, mount at `/api/v1/appointments`

## Phase 4: Frontend Infrastructure (i18n + Types + Services + Utils)

- [ ] 4.1 TDD-RED: Write `calendar.test.ts` — `getWeekStart(date)` returns Monday 00:00, `getWeekEnd(date)` returns Sunday 23:59, `addWeeks(date, n)` crosses month/year bounds, `getTimeSlots(start, end)` generates 30-min intervals
- [ ] 4.2 TDD-GREEN: Create `src/utils/calendar.ts` — pure Date functions: `getWeekStart`, `getWeekEnd`, `addWeeks`, `getTimeSlots`
- [ ] 4.3 Create `src/types/appointment.ts` — `AppointmentStatus`, `Appointment`, `CreateAppointmentDto` frontend types
- [ ] 4.4 Create `src/services/appointment.ts` — `createAppointment(dto)`, `listAppointments(params)`, `getAppointment(id)` using shared `http.ts` client
- [ ] 4.5 Create `src/locales/en/appointments.json` — calendar day labels, month names, status labels (pending/confirmed/completed/cancelled), form labels, week nav labels, "Pet already booked" error
- [ ] 4.6 Create `src/locales/es/appointments.json` — Spanish equivalents with key parity to en
- [ ] 4.7 Modify `src/i18n.ts` — add `appointments` namespace imports (en + es) and register in resources

## Phase 5: Frontend Components (Molecules + AppointmentCard)

- [ ] 5.1 TDD-RED: Write `DateTimePicker.test.tsx` — renders date input + time select, time options constrained to business hours (default 08:00–18:00), 30-min increments
- [ ] 5.2 TDD-GREEN: Create `src/components/molecules/DateTimePicker.tsx` — `<input type="date">` + `<select>` with options generated from `getTimeSlots(workStart, workEnd)`, 30-min interval labels
- [ ] 5.3 Create `src/components/molecules/ClientSearch.tsx` — debounced FTS input (300ms), calls `searchClients(q)` from existing service, renders dropdown results, `onSelect(clientId)` callback
- [ ] 5.4 Create `src/components/organisms/AppointmentCard.tsx` — pet name, client name, time, status badge using `StatusBadge` pattern. `onClick` handler for edit

## Phase 6: Frontend Calendar + Modal + Page (Integration)

- [ ] 6.1 TDD-RED: Write `CalendarWeek.test.tsx` — renders 7 day columns (Mon–Sun), shows correct week label, renders AppointmentCards in correct date/time cells, dims non-workday columns
- [ ] 6.2 TDD-GREEN: Create `src/components/organisms/CalendarWeek.tsx` — CSS Grid: 7 columns + time slot rows. `grid-template-columns: repeat(7, 1fr)`. Get week boundaries from `?week=` URL param or current date. Fetch appointments for visible week. Place `AppointmentCard` in correct grid cell by day + time slot
- [ ] 6.3 TDD-RED: Write `AppointmentModal.test.tsx` — client search filters pets, submit calls createAppointment, shows 409 error inline, close resets form
- [ ] 6.4 TDD-GREEN: Create `src/components/organisms/AppointmentModal.tsx` — multi-step form: ClientSearch → pet dropdown (filtered by clientId from `listPets(clientId)`) → DateTimePicker → notes textarea (max 500) → submit. On 409: show i18n error. Props: `isOpen`, `onClose`, `onCreated`
- [ ] 6.5 Create `src/pages/AppointmentsPage.tsx` — fetches `getSettings()` for business hours, manages `isModalOpen` state, passes `week` from URL to `CalendarWeek`, "New Appointment" button wired to Sidebar callback
- [ ] 6.6 Add `<Route path="/calendar" element={<AppointmentsPage />} />` under `<DashboardLayout>` in `src/App.tsx`
- [ ] 6.7 Wire Sidebar "New Appointment" button — `onClick` triggers `AppointmentsPage` modal-open callback (lift state via DashboardLayout or prop callback)

## Phase 7: Verification

- [ ] 7.1 Run full API unit suite: `npm test` — all appointment tests pass
- [ ] 7.2 Run full API integration suite: `npm run test:integration` — PrismaAppointmentRepository test passes against Docker MySQL
- [ ] 7.3 Run full frontend suite: `npm run test:frontend` — all calendar component tests pass
- [ ] 7.4 Manual smoke test: start `docker compose up -d`, navigate to `/calendar`, create appointment, verify it appears on grid
