# appointment-backend Specification

## Purpose

Backend bounded context for appointment scheduling: entity with TINYINT status enum, `IAppointmentRepository`, CRUD use cases with double-booking prevention, week-filtered listing, and REST routes under `/api/v1/appointments`.

## Requirements

### Requirement: Appointment Entity

The entity MUST include `pet_id`, `client_id` (denormalized from pet on create, never updated), `scheduled_at` (UTC), `status` (TINYINT: 0=pending, 1=confirmed, 2=completed, 3=cancelled), and `notes` (VARCHAR 500). Completed appointments (status=2) MUST NOT be edited.

#### Scenario: Default status on creation

- GIVEN a valid input
- WHEN the entity is instantiated
- THEN status defaults to 0 (pending)

#### Scenario: Denormalized client_id

- GIVEN a pet with `client_id=42`
- WHEN an appointment is created for that pet
- THEN `appointment.client_id` equals `42`

### Requirement: Create Appointment with Double-Booking Check

The `CreateAppointment` use case MUST verify the pet exists, set `status=pending`, and reject with 409 Conflict when the same pet already has an appointment at the same `scheduled_at`. Notes SHALL NOT exceed 500 characters.

#### Scenario: Successful creation

- GIVEN pet 7 has no appointment at "2026-07-20T14:00:00Z"
- WHEN `CreateAppointment` is called with `pet_id=7` and `scheduled_at=2026-07-20T14:00:00Z`
- THEN a new appointment is persisted with status 0

#### Scenario: Double-booking conflict

- GIVEN pet 7 already has an appointment at "2026-07-20T14:00:00Z"
- WHEN `CreateAppointment` is called with same pet and timestamp
- THEN a `ConflictError` is thrown → API returns 409

#### Scenario: Notes exceeds max length

- GIVEN notes field is 501 characters
- WHEN `CreateAppointment` is called
- THEN a `ValidationError` is thrown → API returns 422

### Requirement: Week-Filtered Listing

`ListAppointments` MUST accept optional `start` and `end` (ISO date) query params to filter by `scheduled_at` range. Results SHALL be ordered ascending by `scheduled_at`.

#### Scenario: Date range filter

- GIVEN appointments at July 20, 21, and 28
- WHEN `GET /api/v1/appointments?start=2026-07-20&end=2026-07-26`
- THEN only July 20 and 21 appointments are returned

### Requirement: Update and Cancel Appointments

`UpdateAppointment` MUST allow status transitions (pending↔confirmed, any→cancelled) but SHALL reject edits to completed appointments (status=2→any) with 422. Cancelling (status=3) is a soft state change — the record is preserved.

#### Scenario: Cancel an appointment

- GIVEN appointment 5 has status=0
- WHEN `UpdateAppointment` sets status=3
- THEN the appointment status is updated to 3

#### Scenario: Edit completed appointment blocked

- GIVEN appointment 3 has status=2
- WHEN `UpdateAppointment` is called with any change
- THEN a `ValidationError` is thrown → API returns 422
