# appointment-calendar-frontend Specification

## Purpose

Weekly calendar view at `/calendar` and appointment creation modal. Custom CSS Grid layout with zero external calendar dependencies. Component organization: CalendarWeek (organism), AppointmentCard (molecule), AppointmentModal (organism), DateTimePicker (molecule), ClientSearch (molecule).

## Requirements

### Requirement: Weekly Calendar Grid

The calendar MUST render a CSS Grid with 7 columns (Mon–Sun), paginated by ±7 days. Each cell SHALL show hourly time slots constrained to CompanySettings `workdays`/`workStartTime`/`workEndTime`, with fallback Mon–Fri 08:00–18:00. Week navigation SHALL update `?week=` query param.

#### Scenario: Current week display

- GIVEN today is Wednesday July 22, 2026
- WHEN the `/calendar` page loads
- THEN the grid header shows Mon July 20 – Sun July 26

#### Scenario: Previous/next week navigation

- GIVEN the calendar shows July 20–26
- WHEN "Previous" is clicked
- THEN the grid shows July 13–19
- AND the URL updates to `?week=2026-07-13`

#### Scenario: Business hours fallback

- GIVEN CompanySettings `workStartTime`/`workEndTime` are null
- WHEN the calendar renders
- THEN time slots display 08:00–18:00

#### Scenario: Non-workdays muted

- GIVEN `workdays=[1,2,3,4,5]`
- WHEN the calendar renders
- THEN Saturday and Sunday columns are visually dimmed

### Requirement: AppointmentCard

Each appointment MUST render as an `AppointmentCard` inside its slot cell, showing pet name, client name, and a status badge. Clicking the card SHALL open the edit modal.

#### Scenario: Card rendered in correct slot

- GIVEN an appointment for pet "Max" at Mon 10:00
- WHEN the calendar renders that week
- THEN a card labeled "Max" appears in the Monday 10:00 cell

### Requirement: New Appointment Modal

The Sidebar "New Appointment" button MUST open a modal. Step 1: search clients via FTS, select one. Step 2: filtered pet dropdown for selected client. Step 3: date (`<input type="date">`) and time (`<select>` constrained to business hours). Step 4: notes (`<textarea>`, max 500 chars). On submit, POST to `/api/v1/appointments`; on 409, display "Pet already booked at this time."

#### Scenario: Client FTS filters pet list

- GIVEN client "Maria" owns pets "Luna" and "Rocky"
- WHEN "Maria" is selected from search results
- THEN the pet dropdown shows only Luna and Rocky

#### Scenario: Successful modal submission

- GIVEN valid client, pet, datetime, and notes entered
- WHEN "Save" is clicked
- THEN appointment is created, modal closes, calendar refreshes

#### Scenario: Double-booking error in modal

- GIVEN the API returns 409
- WHEN the modal submission completes
- THEN an inline error "Pet already booked at this time" is shown
