# Design: Create the Clients Frontend

## Technical Approach

Greenfield React 19 frontend for client CRUD — list, search, detail, create, edit, deactivate, and soft-delete via the existing `/api/v1/clients/` REST API. Custom hooks + native `fetch` for data fetching (per exploration recommendation), React Router v7 for routing, and Atomic Design for component structure. Vite dev server proxies `/api` to the backend at `:3000`, eliminating CORS setup.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|-------------|-----------|
| 1 | Data fetching | Custom hooks + `fetch` | TanStack React Query, SWR | AGENTS.md "local state first" philosophy; no extra deps for v1 CRUD; easier to migrate later since service layer abstracts HTTP |
| 2 | Form state | Controlled `useState` per field | React Hook Form, Formik | 5 fields only — form library overhead not justified. Validation on blur + submit with local state + server error display |
| 3 | Destructive actions | Modal (ConfirmDialog) | Inline confirmation | Spec requires modal; safer UX than inline toggles which risk accidental deactivation |
| 4 | Dev CORS | Vite proxy (`server.proxy`) | Express CORS middleware | Single config in `vite.config.ts`; no backend changes needed; standard Vite pattern |
| 5 | Form pages | Dedicated routes (`/new`, `/:id/edit`) | Modal/slide-over | Clean URL state, bookmarkable, testable via navigation; avoids multi-step modal complexity |
| 6 | Responsiveness | Tailwind breakpoints (`md:`, `lg:`) | CSS Grid, media queries | Tailwind v4 utility-first approach keeps responsive styles co-located with components |

## Data Flow

```
Browser ──→ React Router ──→ Page Component
                                 │
                                 ▼
                          Custom Hook (useClients, useClient, useClientMutations)
                                 │
                                 ▼
                          Service Layer (src/services/client.ts)
                                 │
                                 ▼
                          fetch() + base URL from Vite proxy
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
              API:3000/api/v1/clients    Error → Hook state → Component re-render
                     │
                     ▼
              JSON Response → Service parses → Hook stores data/error → Component renders
```

**Key flow**: Page component calls hook at top level → hook calls service on mount/mutation → service calls `fetch` → hook updates `{data, loading, error}` state → component re-renders.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `index.html` | Create | Vite HTML entry point with `<div id="root">` |
| `vite.config.ts` | Create | React plugin, `@/` alias, dev proxy `/api` → `localhost:3000` |
| `postcss.config.js` | Create | PostCSS for Tailwind v4 |
| `src/main.tsx` | Create | React entry, RouterProvider mount |
| `src/App.tsx` | Create | Root layout + route definitions |
| `src/vite-env.d.ts` | Create | Vite client type references |
| `src/index.css` | Create | Tailwind v4 `@import "tailwindcss"` |
| `src/types/client.ts` | Create | Client, CreateClientDto, UpdateClientDto, ApiError interfaces |
| `src/services/http.ts` | Create | Base fetch wrapper: base URL, headers, error normalization |
| `src/services/client.ts` | Create | Typed fetch functions: `listClients`, `getClient`, `createClient`, `updateClient`, `deactivateClient`, `deleteClient`, `searchClients` |
| `src/hooks/useClients.ts` | Create | List + search hook with loading/error/data state |
| `src/hooks/useClient.ts` | Create | Single client fetch hook |
| `src/hooks/useClientMutations.ts` | Create | Create/update/deactivate/delete mutation hooks |
| `src/utils/format.ts` | Create | Date, phone formatting |
| `src/utils/validation.ts` | Create | Client-side validation rules by field |

**Atoms** (7 files):

| File | Description |
|------|-------------|
| `src/components/atoms/Button.tsx` | Reusable button: variants (primary, secondary, danger), loading state |
| `src/components/atoms/Input.tsx` | Text input with label, error message slot |
| `src/components/atoms/Badge.tsx` | Status pill — green (active) / gray (inactive) |
| `src/components/atoms/Spinner.tsx` | Loading spinner SVG |
| `src/components/atoms/Table.tsx` | Generic table with header slot |
| `src/components/atoms/Select.tsx` | Dropdown select with label + error |

**Molecules** (5 files):

| File | Description |
|------|-------------|
| `src/components/molecules/SearchBar.tsx` | Input + button, 300ms debounce, explicit search trigger |
| `src/components/molecules/ClientForm.tsx` | Shared form fields with validation state (used by create + edit pages) |
| `src/components/molecules/ConfirmDialog.tsx` | Modal overlay: message, confirm/cancel buttons |
| `src/components/molecules/Pagination.tsx` | Page prev/next controls |
| `src/components/molecules/StatusBadge.tsx` | Badge wrapping atom with status-aware styling |

**Organisms** (2 files):

| File | Description |
|------|-------------|
| `src/components/organisms/ClientTable.tsx` | Table wrapper: header row + ClientRow × N |
| `src/components/organisms/ClientDetailCard.tsx` | Client detail layout: all fields + action buttons |

**Pages** (4 files):

| File | Description |
|------|-------------|
| `src/pages/ClientListPage.tsx` | `/clients` — SearchBar + ClientTable + Pagination |
| `src/pages/ClientDetailPage.tsx` | `/clients/:id` — ClientDetailCard + ConfirmDialog |
| `src/pages/ClientCreatePage.tsx` | `/clients/new` — ClientForm, submit creates |
| `src/pages/ClientEditPage.tsx` | `/clients/:id/edit` — ClientForm pre-populated |

**E2E**:

| File | Description |
|------|-------------|
| `e2e/clients.spec.ts` | Playwright: full CRUD flow, search, deactivate, responsive |

**Modified files**:

| File | Change |
|------|--------|
| `package.json` | Add React 19, React DOM, Vite, Tailwind v4, React Router v7, @testing-library/react, jsdom, Playwright |
| `tsconfig.json` | Add `"jsx": "react-jsx"`, `"lib": ["ES2022", "DOM", "DOM.Iterable"]` |
| `vitest.config.ts` | Add `jsdom` environment, include `src/**/*.test.{ts,tsx}` |

## Interfaces / Contracts

```typescript
// src/types/client.ts — mirrors backend DTOs
interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface CreateClientDto {
  name: string;
  email: string;
  phone: string;
  phone2?: string;
  address?: string;
}

interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  phone2?: string | null;
  address?: string | null;
}

interface ApiError {
  error: string;
}

// Hook return types
interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  search: (query: string) => void;
  refetch: () => void;
}

interface UseClientReturn {
  client: Client | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

## Validation Rules

| Field | Required | Client-side validation |
|-------|----------|----------------------|
| name | Yes | Non-empty after trim |
| email | Yes | Contains `@`, non-empty |
| phone | Yes | Non-empty after trim |
| phone2 | No | None (optional) |
| address | No | None (optional) |

Validation on blur + submit. Server returns 422 `{ error: string }` which maps to a generic error banner (field-level error mapping is a future enhancement).

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Client-side validation, formatting utils | Pure function tests with Vitest |
| Unit | HTTP service functions | Mock `fetch`, test request construction + response parsing |
| Unit | Custom hooks | Render hooks via `@testing-library/react-hooks`, test state transitions |
| Component | Atoms (Button, Input, Badge, Spinner) | Render + assert props render correctly |
| Component | Molecules (SearchBar, ClientForm, ConfirmDialog, Pagination) | Render + simulate user interaction |
| Component | Pages (list, detail, create, edit) | Render with mock hooks + Router, test full UI states |
| E2E | Full CRUD flow, search, deactivate | Playwright against running app + API |

## Migration / Rollout

No migration required. Frontend-only change — no DB schema, no backend code. Rollback is `git revert` of the frontend files.

## Scaffolding Plan

Install in order:
1. `react@19`, `react-dom@19`, `@types/react`, `@types/react-dom`
2. `react-router@7` (`react-router-dom`)
3. `vite@6`, `@vitejs/plugin-react`
4. `tailwindcss@4`, `postcss`, `autoprefixer` (if needed for v4 build chain)
5. `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
6. `@playwright/test` (dev dep)

## Open Questions

None — all decisions confirmed by exploration and spec.
