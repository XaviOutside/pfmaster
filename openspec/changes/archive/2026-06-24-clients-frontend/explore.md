# Exploration: Create the Clients Frontend

**Date**: 2026-06-24  
**Project**: pfmaster  
**Change**: clients-frontend  
**Phase**: explore  
**Store**: hybrid (Engram + OpenSpec)

---

## Current State

### Frontend — Completely Greenfield
- **No `src/` directory exists** — the AGENTS.md file specifies the target structure, but nothing has been scaffolded.
- **No `vite.config.ts`** — Vite is declared in the tech stack but has not been initialized.
- **No frontend dependencies installed** — the `package.json` only contains backend dependencies (Express, Prisma, Vitest, Supertest, etc.). React 19, React DOM, Vite, Tailwind CSS v4, React Router, and @testing-library/react are all absent.
- **`tsconfig.json`** already has the `@/*` path alias mapped to `src/*`, anticipating the frontend.
- **`vitest.config.ts`** already has the `@/` resolve alias pointing to `src/`, so Vitest is ready for component tests once `src/` exists.

### Backend — Fully Implemented
The Clients API is complete and running at `/api/v1/clients/` via Express:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `GET` | `/api/v1/clients` | List clients (paginated) | `?page=1&limit=20` | `ClientResponseDto[]` |
| `POST` | `/api/v1/clients` | Create client | `CreateClientDto` | `ClientResponseDto` (201) |
| `GET` | `/api/v1/clients/:id` | Get single client | — | `ClientResponseDto` |
| `PUT` | `/api/v1/clients/:id` | Update client | `UpdateClientDto` | `ClientResponseDto` |
| `DELETE` | `/api/v1/clients/:id` | Soft-delete client | — | 204 No Content |
| `PATCH` | `/api/v1/clients/:id/deactivate` | Deactivate client | — | `ClientResponseDto` |
| `GET` | `/api/v1/clients/search` | Full-text search | `?q=term` | `ClientResponseDto[]` |

**`ClientResponseDto` shape** (the contract the frontend must consume):
```typescript
interface ClientResponseDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

**`CreateClientDto`** (for POST body):
```typescript
interface CreateClientDto {
  name: string;        // required
  email: string;       // required, must contain @
  phone: string;       // required
  phone2?: string;     // optional
  address?: string;    // optional
}
```

**`UpdateClientDto`** (for PUT body):
```typescript
interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  phone2?: string | null;  // null to clear
  address?: string | null; // null to clear
}
```

Error responses are always `{ error: string }` with these status codes:
- **404** — client not found (`ClientNotFoundError`)
- **422** — validation error (`ClientValidationError`)
- **409** — already deleted (`ClientAlreadyDeletedError`)
- **500** — internal server error

### Existing Frontend Patterns Reference
The AGENTS.md specifies:
- **Atomic Design**: atoms → molecules → organisms → pages
- **State management**: local component state first; lift only when needed; global store only for auth/session (out of scope for v1)
- **React 19 + TypeScript** with strict mode
- **Tailwind CSS v4** — use `@theme` for design tokens, not `tailwind.config.js`
- **Custom hooks** prefixed with `use`
- **TDD** — Red/Green/Refactor cycle mandatory
- **Vitest** for unit/component tests
- **Playwright** for E2E tests (in `e2e/` directory — may or may not exist yet)
- **Imports**: external libs → `@/` aliases → relative, separated by blank lines

---

## Affected Areas

### New files to create

```
pfmaster/
├── src/                                    # NEW — root frontend directory
│   ├── main.tsx                            # React entry point, RouterProvider
│   ├── App.tsx                             # Root layout + routes
│   ├── vite-env.d.ts                       # Vite type declarations
│   │
│   ├── types/
│   │   └── client.ts                       # Client types mirroring backend DTOs
│   │
│   ├── services/
│   │   ├── client.ts                       # API functions (fetch wrappers)
│   │   └── http.ts                         # Shared HTTP client (base URL, headers, error handling)
│   │
│   ├── hooks/
│   │   ├── useClients.ts                   # Hook for list + search (data fetching)
│   │   ├── useClient.ts                    # Hook for single client fetch
│   │   └── useClientMutations.ts           # Hook for create/update/delete/deactivate mutations
│   │
│   ├── components/
│   │   ├── atoms/
│   │   │   ├── Badge.tsx                   # Status badge (active/inactive)
│   │   │   ├── Button.tsx                  # Reusable button component
│   │   │   ├── Input.tsx                   # Text input with label+error
│   │   │   ├── Select.tsx                  # Dropdown/select component
│   │   │   ├── Spinner.tsx                 # Loading spinner
│   │   │   └── Table.tsx                   # Generic table component
│   │   │
│   │   ├── molecules/
│   │   │   ├── ClientRow.tsx               # Table row for client list
│   │   │   ├── ClientForm.tsx              # Shared form (create + edit)
│   │   │   ├── ConfirmDialog.tsx           # Delete/deactivate confirmation
│   │   │   ├── Pagination.tsx              # Page controls
│   │   │   └── SearchBar.tsx               # Search input with debounce
│   │   │
│   │   └── organisms/
│   │       ├── ClientTable.tsx             # Full table with header + rows
│   │       ├── ClientFilters.tsx           # Search + status filter controls
│   │       └── ClientFormDialog.tsx        # Modal/slide-over for create/edit
│   │
│   ├── pages/
│   │   ├── ClientListPage.tsx              # /clients — list, search, navigate
│   │   ├── ClientDetailPage.tsx            # /clients/:id — view single client
│   │   ├── ClientCreatePage.tsx            # /clients/new — create form
│   │   └── ClientEditPage.tsx              # /clients/:id/edit — edit form
│   │
│   └── utils/
│       ├── format.ts                       # Date formatting, phone formatting
│       └── validation.ts                   # Client-side validation helpers
│
├── index.html                              # Vite HTML entry point
├── vite.config.ts                          # NEW — Vite config with React plugin + aliases
├── tailwind.config.ts                      # Tailwind v4 (or CSS @import approach)
├── postcss.config.js                       # PostCSS for Tailwind (if needed for v4)
│
├── e2e/
│   └── clients.spec.ts                     # NEW — Playwright E2E tests for client flows
│
└── package.json                            # MODIFIED — add frontend deps
```

### Existing files to modify

| File | Change |
|------|--------|
| `package.json` | Add React 19, Vite, Tailwind CSS v4, React Router, @testing-library/react, Playwright, etc. |
| `docker-compose.yml` | Add frontend `app` service (Vite dev server) with port mapping (e.g., 5173:5173) |
| `tsconfig.json` | Potentially update (already has `@/*` → `src/*`; may need `jsx: "react-jsx"`, `lib: ["ES2022", "DOM"]`) |
| `vitest.config.ts` | Add component testing environment (`jsdom`), include `src/**/*.test.{ts,tsx}` |

---

## Approaches

### Approach 1 — TanStack React Query + Fetch

**Description**: Use TanStack React Query (v5) for server state management (caching, refetching, optimistic updates) with native `fetch` for HTTP calls. React Query handles loading/error states, pagination, and cache invalidation.

- **Data flow**: `fetch` service → React Query hooks (`useQuery`/`useMutation`) → components consume via hook return values
- **Forms**: Controlled components with local `useState`, validated on submit
- **Routing**: React Router v7 with layout routes

**Pros**:
- Declarative server state — no manual loading/error state management
- Automatic cache invalidation after mutations
- Built-in pagination support (`useQuery` with `keepPreviousData`)
- Optimistic updates for a snappy UX
- Well-documented, mature library (TanStack Query v5 is stable)

**Cons**:
- Adds ~15KB dependency to the bundle
- Learning curve for query keys and cache invalidation patterns
- Overkill if the app stays small (single-user, low data volume)
- React Query + TS strictness can be verbose for simple CRUD

**Effort**: Medium

---

### Approach 2 — Lightweight Custom Hooks + fetch

**Description**: Build a thin layer of custom hooks (`useClients`, `useClient`, `useClientMutations`) wrapping native `fetch`. Each hook manages its own loading, error, and data states. No external data-fetching library.

- **Data flow**: `fetch` service → custom hooks with `useState`/`useEffect` → components
- **Forms**: Controlled components with local `useState`
- **Routing**: React Router v7

**Pros**:
- Zero additional dependencies — lean bundle
- Full control over data flow — no query key ceremony
- Easier to understand for a master's project (demonstrates fundamental React skills)
- Aligns with AGENTS.md "local component state first" philosophy

**Cons**:
- Manual loading/error state management in every hook (boilerplate)
- No caching, deduplication, or background refetching out of the box
- Pagination state must be managed manually
- As the app grows (pets, services, appointments), each domain reimplements the same patterns

**Effort**: Low-Medium

---

### Approach 3 — SWR + fetch

**Description**: Use Vercel's SWR library for lightweight data fetching with built-in caching, revalidation, and pagination support. Lighter than React Query but still provides caching.

- **Data flow**: `fetch` service → SWR hooks (`useSWR`/`useSWRMutation`) → components
- **Forms**: Controlled components with local `useState`
- **Routing**: React Router v7

**Pros**:
- Lightweight (~4KB) compared to React Query (~15KB)
- Built-in cache + revalidation (stale-while-revalidate pattern)
- Good DX for read-heavy pages (list + detail)
- Works well with REST endpoints

**Cons**:
- Mutation support (`useSWRMutation`) is more limited than React Query
- Pagination requires `useSWRInfinite` which has a more complex API
- Smaller ecosystem and community compared to React Query
- Optimistic updates are more manual than React Query

**Effort**: Medium

---

### Approach 4 — Zustand + Effect-based fetching

**Description**: Use Zustand for global client state management, with `useEffect`-based fetching in components to populate the store. Combines a central store with manual fetching.

**Pros**:
- Centralized state if multiple pages need the same data
- Zustand is tiny (~1KB), no boilerplate
- Good if the detail page needs to share state with the list page

**Cons**:
- Violates AGENTS.md "local state first, global only for auth/session"
- More complex than needed for a simple CRUD domain
- State synchronization issues between stores and server
- Over-engineered for read-heavy list + detail patterns

**Effort**: Medium-High

---

### Route & Component Architecture

**Routes** (under `/clients`):
```
/clients                  → ClientListPage
/clients/new              → ClientCreatePage
/clients/:id              → ClientDetailPage
/clients/:id/edit         → ClientEditPage
```

**Component tree for ClientListPage**:
```
ClientListPage
├── SearchBar (molecule)
├── StatusFilter (molecule, optional)
├── ClientTable (organism)
│   ├── Table (atom)
│   └── ClientRow (molecule) × N
└── Pagination (molecule)
```

**Component tree for ClientForm pages**:
```
ClientCreatePage / ClientEditPage
├── ClientForm (molecule)
│   ├── Input (atom) — name
│   ├── Input (atom) — email
│   ├── Input (atom) — phone
│   ├── Input (atom) — phone2 (optional)
│   ├── Input (atom) — address (optional, textarea)
│   └── Button (atom) — submit
├── Button (atom) — cancel
└── ConfirmDialog (molecule) — discard changes warning
```

**Component tree for ClientDetailPage**:
```
ClientDetailPage
├── DetailCard (organism)
│   ├── Badge (atom) — status
│   ├── Field rows (atoms) — name, email, phone, etc.
│   └── Button group — edit, deactivate/reactivate, delete
└── ConfirmDialog (molecule) — confirm deactivate/reactivate/delete
```

---

## Recommendation

**Approach 2** (Lightweight Custom Hooks + fetch) **for this change**, with a plan to migrate to **Approach 1** (React Query) if the app grows beyond the Clients domain.

**Rationale**:
1. **Greenfield project** — Adding React Query immediately adds a dependency and learning curve before a single component is rendered. Starting with custom hooks keeps the focus on building the UI correctly.
2. **AGENTS.md alignment** — "local component state first; lift only when needed" explicitly prefers this approach. A global data-fetching library contradicts this philosophy for a v1.
3. **Master's project context** — Writing custom hooks demonstrates understanding of React fundamentals (state, effects, custom hook patterns). A data-fetching library abstracts this away.
4. **CRUD scope** — Clients is straightforward CRUD with one paginated list endpoint. The overhead of React Query's cache invalidation for simple create → redirect → refetch is not justified.
5. **Migration path** — The service layer (`src/services/client.ts`) is the abstraction boundary. When the app grows, React Query (or SWR) can wrap the same service functions without changing components — just replace the hooks.

**Component strategy**: Build the atomic design components as truly reusable primitives (Button, Input, Badge, Table, Spinner) that other domains (pets, services, appointments) will also use. The Clients-specific molecules (ClientRow, ClientForm, ClientFormDialog) compose from these atoms. Pages compose from molecules and organisms.

**No modal/slide-over for forms** — use dedicated pages (`/clients/new`, `/clients/:id/edit`). This keeps URL state, simplifies testing, and avoids the complexity of multi-step modals in v1.

---

## Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data fetching | Custom hooks + fetch | AGENTS.md alignment, no unnecessary deps for v1 |
| Forms | Controlled components + useState | Simplest, no form library overhead for 5 fields |
| Validation | Client-side (on blur + submit) + server error display | Dual validation — fast UX feedback + server authority |
| Routing | React Router v7 (`createBrowserRouter`) | Standard React routing, layout routes for future header/nav |
| Form pages | Dedicated routes, no modals | Clean URL state, testable, simple |
| Status display | Badge component (green/gray) | Visual status at a glance in table and detail |
| Deactivation | Button on detail page → PATCH call | Backend requires explicit PATCH endpoint, not PUT |
| Pagination | Offset-based (page + limit) | Mirrors backend API contract |
| Search | Debounced input (300ms) → GET /search | FTS search through backend, no client-side filtering |

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Tailwind CSS v4 migration** | 🟡 MEDIUM | v4 changes the config approach — use `@import "tailwindcss"` in CSS, no `tailwind.config.js`. Must verify v4-specific setup before scaffolding. |
| **React 19 compatibility** | 🟡 MEDIUM | React 19 is relatively new. Verify that React Router v7 and @testing-library/react are compatible before locking versions. |
| **CORS in development** | 🟢 LOW | Backend runs on `:3000`, Vite on `:5173`. Either configure Vite proxy (`vite.config.ts` server.proxy) or add CORS headers to Express. Proxy is cleaner for dev. |
| **TypeScript strict with React** | 🟢 LOW | `tsconfig.json` has `strict: true` but no `jsx` config. Must add `"jsx": "react-jsx"` and `"lib": ["ES2022", "DOM", "DOM.Iterable"]`. |
| **Shared types duplication** | 🟡 MEDIUM | The frontend must redefine types that mirror the backend DTOs. Without a shared package, these can drift. Mitigation: keep `src/types/client.ts` in sync with `api/clients/interface/dtos/`. |
| **docker-compose changes** | 🟢 LOW | Adding a frontend service requires updating the Docker Compose file. Standard Vite + multi-stage build pattern. |
| **Scope creep (CRUD maturity)** | 🟡 MEDIUM | Keeping the first version simple — no inline editing, no bulk actions, no printable views. These can be added in follow-up changes. |

---

## Open Questions (resolve before proposal)

| # | Question | Impact |
|---|----------|--------|
| 1 | **Should form validation be client-side only, or also use a schema library (Zod)?** | Zod adds ~8KB but enables shared validation patterns. If the backend also uses Zod later, schemas could be shared. |
| 2 | **Should deactivation be accessible from the list page (inline toggle) or only from the detail page?** | Affects ClientListPage complexity — inline toggle needs per-row state vs. redirect to detail. |
| 3 | **Is a confirmation dialog needed for deactivate? For delete?** | Affects ConfirmDialog molecule and UX flow. Soft delete (204 No Content) is destructive — confirmation is standard UX. |
| 4 | **Should reactivate be supported?** | The backend has `PATCH /deactivate` but no `/reactivate` endpoint currently (only `PUT` with `status` field blocked). May need a new endpoint or allow `status` in update. |

---

## Ready for Proposal

**Yes** — the exploration is complete and the approach is clear. Surface **Open Questions 1–4** to the user during the proposal phase for clarification, but none of them block the architectural direction.

---

*Generated by sdd-explore skill · pfmaster · 2026-06-24*
