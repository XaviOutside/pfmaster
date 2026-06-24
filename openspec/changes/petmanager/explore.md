# Exploration: petmanager

**Date**: 2026-06-22  
**Project**: pfmaster  
**Change**: petmanager  
**Phase**: explore  
**Store**: hybrid (Engram + OpenSpec)

---

## Current State

This is a **greenfield project**. No source code, no package manifest, no test infrastructure exists.
The project `pfmaster` is the author's master's degree final project ("Proyecto final del master").
The `.gitignore` signals a JavaScript/TypeScript + Node.js ecosystem — framework is unconfirmed.

---

## Domain Interpretation

### What is petmanager?

**"petmanager"** is interpreted as a **pet management module** — a subsystem for tracking, managing, and providing services around pets. Given the project name `pfmaster`:

- `pf` most likely stands for **"pet file"** (as in a pet's health/care record) rather than "portfolio" — the term "master" here is the academic degree, not a git branch.
- `pfmaster` = "pet file master" = the authoritative system for managing pet records.
- Alternatively, `pf` could stand for **"pet family"** — the platform manages families of pets and their owners.

**Most likely interpretation**: A **pet health and care management platform** — owners register their pets, track health records, schedule vet appointments, and manage care tasks (feeding, medication, vaccination schedules).

**Secondary interpretation**: A **pet adoption / shelter management** system — shelters register animals, manage adoptions, and track animal histories. Less likely given the single-project context of a master's project.

**Chosen interpretation for this exploration**: Pet health and care management, centered on an **Owner → Pet → Health Record** relationship model. This aligns with the `pfmaster` acronym and provides appropriate complexity for a master's final project.

---

## Core Domain Entities

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| **User / Owner** | Person who owns or manages pets | id, name, email, phone, address, createdAt |
| **Pet** | The central entity | id, name, species, breed, birthDate, weight, sex, profilePhoto, ownerId |
| **HealthRecord** | A log entry for a pet's health event | id, petId, type, date, notes, attachments |
| **Vaccination** | A specific vaccination record | id, petId, vaccine, administeredAt, nextDueAt, vetId |
| **Appointment** | A scheduled vet or grooming visit | id, petId, type, scheduledAt, location, vetId, status, notes |
| **Medication** | Ongoing medication tracking | id, petId, name, dosage, frequency, startDate, endDate |
| **Vet / Provider** | Veterinarian or care provider | id, name, clinic, specialty, phone, email |
| **Reminder** | Scheduled notification for care events | id, petId, type, dueAt, message, notified |

**Primary aggregates**:
- `Pet` (root) → owns HealthRecord, Vaccination, Medication, Appointment
- `User` → owns Pets
- `Vet` → referenced by Appointment, Vaccination

---

## Primary Use Cases

1. **Register a pet** — Owner creates a pet profile (name, species, breed, birth date, photo).
2. **View pet dashboard** — Owner sees a pet's full profile, upcoming appointments, current medications, and vaccination status at a glance.
3. **Log a health event** — Owner or vet records a health incident, checkup note, or observation for a pet.
4. **Schedule an appointment** — Owner books a vet, grooming, or wellness appointment for a pet; receives a reminder.
5. **Track vaccinations** — Owner records administered vaccinations; system flags overdue or upcoming vaccinations.
6. **Manage medications** — Owner adds and tracks ongoing medications with dosage and frequency; system sends reminders.
7. **Upload documents / attachments** — Owner attaches vet reports, lab results, or prescription PDFs to health records.
8. **Multi-pet management** — Owner with multiple pets can switch between them and view a consolidated upcoming-events feed.

**Optional / stretch use cases**:
- Weight and growth tracking over time (charts)
- Pet emergency contacts and allergy flags
- Sharing pet profile with a secondary caregiver or vet
- Export pet history as PDF

---

## Integration Surface

| System / Layer | Purpose | Notes |
|----------------|---------|-------|
| **Authentication provider** | User identity (login/signup) | Auth.js / NextAuth, Supabase Auth, Clerk, or Firebase Auth — choice depends on framework |
| **Relational DB** | Persistent storage for entities | PostgreSQL (preferred for relational model), SQLite (simpler for solo dev), or Supabase (BaaS shortcut) |
| **ORM / Query layer** | Type-safe data access | Prisma (TS-first, excellent DX), Drizzle (lighter), or Supabase client |
| **File storage** | Pet photos, document attachments | Cloudinary, AWS S3, Supabase Storage, or Vercel Blob |
| **Email / Notification** | Appointment and vaccination reminders | Resend, Nodemailer, or Supabase Edge Functions + SMTP |
| **REST or tRPC API** | Backend-to-frontend data contract | Next.js API routes / tRPC if Next.js; Nuxt server routes if Nuxt; SvelteKit endpoints if SvelteKit |
| **Calendar / scheduling** | Optional appointment visualization | Simple date pickers; optionally Google Calendar API for sync |

---

## Architecture Approaches

### Option A — Full-stack meta-framework (Next.js / Nuxt / SvelteKit) + Prisma + PostgreSQL

- **Description**: Single-repo monolith using a JS meta-framework for both frontend and API layers. Prisma manages the DB schema and migrations. Postgres is the persistence layer.
- **Pros**:
  - Cohesive DX — one language, one repo, co-located API routes
  - Prisma schema is the single source of truth for the data model
  - Excellent TypeScript support across the entire stack
  - Strong ecosystem (Auth.js, tRPC, Zod)
  - Easiest to deploy to Vercel / Railway / Render
- **Cons**:
  - Framework choice is still uncommitted — must decide before implementation
  - Slightly higher initial setup cost vs. BaaS
  - Server-side rendering complexity if the app is mostly CRUD
- **Effort**: Medium
- **Recommended if**: The user wants to demonstrate full-stack architecture skills (appropriate for a master's project)

### Option B — Next.js + Supabase (BaaS)

- **Description**: Next.js for frontend + Supabase for auth, DB (Postgres under the hood), storage, and real-time.
- **Pros**:
  - Dramatically reduces backend boilerplate
  - Built-in auth, storage, and REST/GraphQL APIs
  - Supabase Studio gives a visual DB dashboard
  - Fast to prototype and demo
- **Cons**:
  - Locks to Supabase platform (vendor dependency)
  - Less control over DB migrations and schema evolution
  - Demonstrates less architectural depth than Option A
- **Effort**: Low
- **Recommended if**: The user prioritizes shipping speed and feature breadth over architectural rigor

### Option C — Decoupled SPA (React/Vue) + Express/Fastify API + PostgreSQL

- **Description**: Frontend SPA + separate REST API server + Postgres. Classic separation of concerns.
- **Pros**:
  - Maximum flexibility and explicit architecture
  - Clear separation between frontend and backend — good for demonstrating layered architecture
  - Can evolve independently
- **Cons**:
  - Higher boilerplate (two separate apps to scaffold, CORS, separate deployments)
  - TypeScript sharing across apps requires a monorepo or shared types package
  - More infrastructure to manage
- **Effort**: High
- **Recommended if**: The master's project rubric rewards explicit architectural separation

---

## Recommendation

**Option A** — Full-stack meta-framework (preferably **Next.js App Router** given its popularity and ecosystem depth, or **SvelteKit** if the user prefers Vue-like simplicity) + **Prisma** + **PostgreSQL (via Railway or Neon)**.

Rationale:
1. A master's final project benefits from demonstrating end-to-end architectural decisions — Option A exposes the student to schema design (Prisma), API contract (tRPC or REST), and UI patterns.
2. The `pfmaster` name and health-record domain map cleanly to a relational model — PostgreSQL + Prisma is the natural fit.
3. Option B (Supabase) is faster but hides complexity; Option C is too fragmented for a solo final project.
4. The **framework must be confirmed** by the user before proceeding to proposal — this is the single most important open question.

---

## Open Questions (MUST resolve before proposal)

| # | Question | Impact |
|---|----------|--------|
| 1 | **Which framework?** Next.js, Nuxt, SvelteKit, or other? | Determines routing, rendering model, API layer, and file structure |
| 2 | **Database target?** Hosted Postgres (Neon/Railway), SQLite (local dev only), or Supabase BaaS? | Determines ORM choice, migration strategy, and deployment constraints |
| 3 | **Authentication scope?** Email/password only? OAuth (Google, GitHub)? Magic link? | Determines auth library and user model complexity |
| 4 | **Who are the target users?** Pet owners only? Does the system need vet/provider accounts? | If vets have accounts, the permission model becomes significantly more complex |
| 5 | **Mobile or web only?** Is this a web app, or does it need to be responsive/PWA for mobile use? | Affects UI component library choice and layout priorities |
| 6 | **File uploads required?** Do owners upload vet documents and pet photos? | Adds file storage integration (S3, Cloudinary, Supabase Storage) |
| 7 | **Reminders / notifications?** Are email or push reminders needed for vaccinations and appointments? | Adds background job or scheduled function complexity |
| 8 | **Scope for the master's project submission?** Are there specific rubric requirements (e.g., must include auth, must include tests, must deploy)? | Directly constrains which features MUST be built |

---

## Risks

| Risk | Severity | Notes |
|------|----------|-------|
| **Framework not chosen** | 🔴 HIGH | Cannot proceed to proposal without a confirmed framework — all architectural decisions branch from this |
| **Data model complexity** | 🟡 MEDIUM | If vet accounts are added, RBAC (Role-Based Access Control) significantly increases complexity |
| **File storage scope creep** | 🟡 MEDIUM | Attachments on health records are a common "quick add" that hides significant infrastructure work |
| **Reminder/notification system** | 🟡 MEDIUM | Background jobs (cron, queues) are non-trivial to implement and deploy correctly |
| **Schema migrations** | 🟡 MEDIUM | Prisma migrations must be planned carefully — renaming fields post-deploy is painful |
| **Authentication choice** | 🟡 MEDIUM | Locking to a specific auth library (Clerk, Auth.js, Supabase Auth) early can be hard to reverse |
| **Scope for master's deadline** | 🟡 MEDIUM | Feature creep is a real risk for academic projects with fixed deadlines — must define MVP clearly |
| **TypeScript strictness** | 🟢 LOW | No existing codebase to break; fresh start makes strict TypeScript easy to enforce from day one |

---

## Ready for Proposal

**Partial — blocked on framework and database questions.**

The domain model is clear enough to proceed with a proposal, but the orchestrator should surface **questions 1 and 2** (framework, database) to the user before writing a proposal. Questions 3–8 can be resolved incrementally during the spec phase.

**Minimum viable answer set for unblocking**:
- Framework choice (Next.js / Nuxt / SvelteKit / other)
- Database target (hosted Postgres / SQLite / Supabase)

---

*Generated by sdd-explore skill · pfmaster · 2026-06-22*
