# Archive Report: Appointment Calendar System

**Change**: appointment-calendar  
**Archived**: 2026-07-19  
**Artifact Store**: hybrid (Engram + OpenSpec)  
**Archive Verdict**: PASS — all gates cleared

## Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| Review Receipt | N/A | No formal review artifact required; orchestrator invoked archive directly |
| Task Completion | ✅ PASS | 44/44 implementation tasks checked in tasks.md |
| Build | ✅ PASS | `tsc --project tsconfig.json` exit 0 (CRITICAL issue from verify-report resolved) |
| Tests | ✅ PASS | 423/424 backend, 316/327 frontend, 143/143 appointment-specific |
| Spec Compliance | ✅ PASS | 21/21 scenarios compliant across 3 specs |

## CRITICAL Issue Resolution

The verify-report (#152) flagged a CRITICAL blocker: TypeScript build failed with 2 strict-mode errors. These were resolved between verification and archive:

1. **Appointment.ts:20** — `APPOINTMENT_STATUS_LABELS: Record<number, string>` annotation added (computed-key narrowing)
2. **AppointmentController.ts:146** — `status as AppointmentStatus` cast added (union type guard)

Build now passes cleanly. No code changes were made during archive — fixes were present in the working tree at archive time.

## Engram Observation IDs (Audit Trail)

| Artifact | Observation ID | Topic Key |
|----------|---------------|-----------|
| Proposal | #146 | sdd/appointment-calendar/proposal |
| Specs | #147 | sdd/appointment-calendar/spec |
| Design | #148 | sdd/appointment-calendar/design |
| Tasks | #149 | sdd/appointment-calendar/tasks |
| Apply Progress | #150 | sdd/appointment-calendar/apply-progress |
| Verify Report | #152 | sdd/appointment-calendar/verify-report |

## Specs Synced

| Domain | Action | Requirements | Details |
|--------|--------|-------------|---------|
| appointment-backend | Created | 4 | NEW spec: Entity, double-booking, week-filtered listing, update/cancel |
| appointment-calendar-frontend | Created | 3 | NEW spec: Calendar grid, AppointmentCard, modal form |
| i18n-infrastructure | Modified | 2 (of 6 total) | Updated: 6→7 namespaces, 12→14 locale files, appointment-based scenario examples |

## Archive Contents

```
openspec/changes/archive/2026-07-19-appointment-calendar/
├── proposal.md
├── exploration.md
├── design.md
├── tasks.md             (44/44 ✅)
├── verify-report.md
├── archive-report.md
└── specs/
    ├── appointment-backend/spec.md
    ├── appointment-calendar-frontend/spec.md
    └── i18n-infrastructure/spec.md
```

## Source of Truth Updated

- `openspec/specs/appointment-backend/spec.md` — created
- `openspec/specs/appointment-calendar-frontend/spec.md` — created
- `openspec/specs/i18n-infrastructure/spec.md` — updated (7 namespaces, 14 locale files)

## Deviations from Design

1. Modal wired via `window.dispatchEvent(new CustomEvent('open-appointment-modal'))` instead of prop drilling
2. No isolated `AppointmentModal.test.tsx` — covered by CalendarWeek integration tests + E2E
3. UTC time in AppointmentCard using `getUTCHours()`/`getUTCMinutes()` instead of locale-aware formatting

## Warnings

- 12 pre-existing test failures (all unrelated to appointments)
- Proposal success criteria checkboxes remain unchecked in archived proposal.md (verified compliant by verify-report: 21/21 scenarios)

## SDD Cycle Complete

All 4 PRs delivered, 44 tasks implemented, 143 new tests passing, 3 specs synced to source of truth.
