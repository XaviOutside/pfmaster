# Exploration: Appointment Calendar System

## Current State

The pfmaster application currently manages **Clients**, **Pets**, **Services**, and **Settings** — but has **zero appointment functionality**. The entire `api/appointments/` bounded context does not exist. The Prisma schema has no `Appointment` model. No API routes for appointments are registered in `api/index.ts`.

However, the **frontend UI anticipates appointments**: the `Sidebar` component already renders:
- A `/calendar` navigation item with a `calendar_month` icon (line 16 of `Sidebar.tsx`)
- A "New Appointment" CTA button (line 87, using translation key `navigation.newAppointment`)

Both are inert — clicking them does nothing because the route `/calendar` is not defined in `App.tsx`, and the button has no `onClick` handler.

**Existing infrastructure that the appointment feature will leverage:**
- **CompanySettings** stores `workdays` (JSON array of integers 1–7, Mon=1), `workStartTime`, and `workEndTime` — directly relevant for calendar business-hour display and validation
- All existing bounded contexts (clients, pets, services) follow a consistent Clean Architecture pattern that the appointments context must replicate
- Frontend has a full Atomic Design component library (atoms, molecules, organisms, templates) with reusable DataTable, PageHeader, Modal, Select, Button, Input, SearchBar components
- `http.ts` wraps all API calls with base URL `/api/v1`, JSON serialization, and structured error handling
- i18n via `react-i18next` with translation namespaces

## Affected Areas

### Backend — must be created from scratch
- **`prisma/schema.prisma`** — Add `Appointment` model with fields: `id`, `pet_id`, `service_id`, `scheduled_at` (DateTime), `status` (TINYINT: 0=pending, 1=confirmed, 2=completed, 3=cancelled), `notes` (nullable text), `created_at`, `updated_at`
- **`api/appointments/domain/`** — Appointment entity, AppointmentStatus enums, `IAppointmentRepository` interface, `CreateAppointmentInput`, `UpdateAppointmentInput`
- **`api/appointments/application/`** — Use cases: `CreateAppointment`, `GetAppointment`, `ListAppointments` (with date-range/week filtering), `UpdateAppointment`, `CancelAppointment`
- **`api/appointments/interface/`** — `AppointmentController`, `appointmentRouter`, DTOs
- **`api/appointments/infrastructure/`** — `PrismaAppointmentRepository`
- **`api/index.ts`** — Wire appointments bounded context (imports, instantiation, route mounting at `/api/v1/appointments`)
- **`api/db/migrations/`** — New migration for appointments table

### Frontend — must be created from scratch
- **`src/types/appointment.ts`** — Frontend types (mirrors DTO shape)
- **`src/services/appointment.ts`** — API client functions
- **`src/App.tsx`** — Add routes: `/calendar` (weekly view), `/appointments/new` (creation form), `/appointments/:id` (detail)
- **`src/pages/`** — `AppointmentsPage.tsx` (calendar view), `AppointmentCreatePage.tsx` (new appointment form)
- **`src/components/organisms/`** — `CalendarWeek.tsx` (weekly grid), `AppointmentCard.tsx`
- **`src/components/molecules/`** — `AppointmentForm.tsx`, `DateTimePicker.tsx` (if built custom)
- **`src/components/templates/DashboardLayout.tsx`** — No changes needed (uses `<Outlet />`)
- **`src/components/organisms/Sidebar.tsx`** — The "New Appointment" button needs an `onClick` or `<NavLink>` to navigate to `/appointments/new`
- **`src/utils/`** — Add `calendar.ts` (week start/end calculation, date navigation helpers)
- **`src/locales/`** — i18n keys for appointments, calendar, forms

### Optional / Cross-cutting
- **`api/shared/domain/errors.ts`** — May need `ConflictError` (for double-booking) — currently has NotFoundError, ValidationError, AlreadyDeletedError
- **`api/settings/`** — May need a use case to expose workdays/work-hours publicly (calendar view needs them for time grid)
- **`package.json`** — Potential new dependency (date picker library)

## Approaches

### Approach 1: Custom calendar built with Tailwind CSS (recommended)

Build the weekly calendar grid from scratch using CSS Grid / Tailwind utilities. Build a custom DateTimePicker using existing atoms (Input, Select, Button).

- **Pros**: Zero external dependencies, full control over UX, matches Stitch design system perfectly, no version-compatibility risk, simpler to test (no library mocking), consistent with existing "no unnecessary deps" philosophy
- **Cons**: More initial effort for time-picker UI, need to handle edge cases (timezone, DST, 24h/12h), custom a11y work
- **Effort**: Medium

### Approach 2: Install react-datepicker + date-fns

Add `react-datepicker` (for date/time picker) and `date-fns` (for week calculations).

- **Pros**: Battle-tested date picker with time selection, handles a11y, localization via date-fns, less custom code for date/time input
- **Cons**: External dependency (react-datepicker ~200KB), styling override needed for Material 3 design tokens, library API surface to learn and maintain, adds to Snyk attack surface, may conflict with Tailwind CSS v4 styling
- **Effort**: Medium (less code, more integration)

### Approach 3: FullCalendar library

Use `@fullcalendar/react` + `@fullcalendar/daygrid` + `@fullcalendar/timegrid` for the calendar view.

- **Pros**: Full-featured calendar component (drag-and-drop, time grid, event rendering)
- **Cons**: Heavy dependency (~500KB+), significant styling override burden for Material 3, overkill for a weekly view, introduces jQuery-like event system, large API surface, harder to test
- **Effort**: Low (plug-and-play) but High maintenance burden

## Recommendation

**Approach 1 (Custom Tailwind CSS Calendar)** — for the following reasons:

1. The project has zero external UI widget dependencies — introducing react-datepicker or FullCalendar would be the first and sole exception to a clean dependency profile
2. The weekly view is a simple 7-column grid with time slots — not complex enough to justify a library
3. The existing design system (Material 3 tonal palette, Montserrat + Inter) means any library would need heavy style overrides, negating the "plug-and-play" advantage
4. TDD is mandatory — custom components are easier to test without mocking third-party internals
5. The app is single-user v1 — no complex scheduling, resource management, or conflict resolution needed yet

The "New Appointment" form needs a datetime picker. For this, build a custom `DateTimePicker` molecule using:
- `<input type="date">` for date (native, well-supported)
- `<select>` or custom time slot picker for hour/minute (constrained to business hours from CompanySettings)
- This avoids any calendar library entirely

For week calculations (`getWeekStart`, `getWeekEnd`, `addWeeks`), write a small `src/utils/calendar.ts` — pure functions, easily tested, no library needed. These are trivial date math operations.

## Risks

1. **No Appointment model in Prisma schema yet** — need to define the exact fields and status enum values before implementation. The AGENTS.md specifies: `pet_id`, `service_id`, `scheduled_at`, `status` (0=pending, 1=confirmed, 2=completed, 3=cancelled), `notes`. Need to confirm if `client_id` should be denormalized for performance (it's derivable from `pet_id` → `client_id`, but a calendar listing all appointments would need a JOIN).

2. **Business hours from CompanySettings** — the calendar time grid should respect `workStartTime`/`workEndTime` and highlight only `workdays`. If settings are not loaded, there's no fallback time range defined. Need to handle null/empty settings gracefully.

3. **Sidebar button has no handler** — the "New Appointment" button in the sidebar is a `<button>` with no `onClick` or navigation. This needs to become a `<NavLink>` or `useNavigate()` call.

4. **No FK constraints** — referential integrity for `pet_id` and `service_id` is at the application layer. Need validation in the `CreateAppointment` use case to verify both exist before inserting.

5. **Overlapping appointments** — v1 scope: the user hasn't mentioned double-booking prevention, but the AGENTS.md domain model doesn't specify it either. Should be clarified in proposal phase.

6. **i18n scope** — calendar labels (day names, "Week of", "Previous/Next week") need translation keys. The app supports English and Spanish.

7. **CompanySettings workdays format** — stored as JSON `[1,2,3,4,5]`, but frontend needs to map to day names. The settings DTO currently exposes `workdays` as `number[]` — verify it's available to the frontend via the settings API.

## Ready for Proposal

**Yes.** The codebase is well-understood, the patterns are consistent, and the scope is clear. The orchestrator should proceed to `sdd-propose` with the following clarifications to raise with the user:

1. Confirm the Appointment domain model fields (especially whether `client_id` should be denormalized or derived from `pet_id`)
2. Clarify overlap/double-booking behavior (prevent? warn? allow?)
3. Confirm weekly view start day (Monday per CompanySettings workdays Mon=1, or user's locale Sunday?)
4. Confirm the "New Appointment" button in Sidebar should navigate to a full-page form at `/appointments/new` (not a modal/dialog)
