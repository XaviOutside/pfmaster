# Tasks: Create the Clients Frontend

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1000-1500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (scaffold) → PR 2 (types/services/hooks/atoms) → PR 3 (organisms/pages/tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Scaffold Vite + React + Tailwind + test infra | PR 1 | Base: main. Config, docker-compose, entry points. |
| 2 | Types, services, hooks, atomic components | PR 2 | Depends on PR 1. Data layer + reusable UI kit. |
| 3 | Organisms, pages, E2E tests | PR 3 | Depends on PR 2. User-facing views + full flow tests. |

## Phase 1: Foundation & Scaffolding (PR 1 ✅)

- [x] 1.1 Install frontend dependencies — React 19, React DOM, React Router v7, Tailwind CSS v4, @types/react, @types/react-dom, @tailwindcss/vite, Vite 6, jsdom
- [x] 1.2 Create `vite.config.ts` with React plugin, `@/` alias to `src/`, and dev proxy `/api` → `http://localhost:3000`
- [x] 1.3 Create `vitest.frontend.config.ts` — jsdom environment, `src/**/*.test.{ts,tsx}`, `@/` alias (separate from backend vitest config)
- [x] 1.4 Update `tsconfig.json` — add `"jsx": "react-jsx"`, add `"DOM"` and `"DOM.Iterable"` to `"lib"`
- [x] 1.5 Create `index.html` — Vite entry pointing to `src/main.tsx`
- [x] 1.6 Create `src/main.tsx` (React root render) and `src/App.tsx` (Router shell with placeholder routes for `/clients/*`)
- [x] 1.7 Create `src/index.css` with `@import "tailwindcss"` (Tailwind v4 syntax)
- [x] 1.8 Update `docker-compose.yml` — add `app` service (port 5173, Vite dev server, depends on api)

## Phase 2: Types, Services & Hooks

- [x] 2.1 Create `src/types/client.ts` (Client, CreateClientDto, UpdateClientDto, ClientResponse types)
- [x] 2.2 Create `src/services/http.ts` (base fetch wrapper, HttpError class, error normalization)
- [x] 2.3 Create `src/services/client.ts` (list, get, create, update, deactivate, reactivate, delete, search)
- [x] 2.4 Create `src/hooks/useClients.ts` (list + search with loading/error/data, race-condition safe)
- [x] 2.5 Create `src/hooks/useClient.ts` (single client fetch by id, re-fetch on id change)
- [x] 2.6 Create `src/hooks/useClientMutations.ts` (create, update, deactivate, reactivate, delete with loading/error)
- [x] 2.7 Create `src/utils/format.ts` (date, phone formatting — deferred to PR 3)
- [x] 2.8 Create `src/utils/validation.ts` (client-side validation by field, composite validator)

## Phase 3: Atomic Components

- [x] 3.1 Create `src/components/atoms/Button.tsx` (variant: primary/secondary/danger/ghost, size: sm/md/lg, disabled, loading)
- [x] 3.2 Create `src/components/atoms/Input.tsx` (label, error display, required indicator, onChange)
- [x] 3.3 Create `src/components/atoms/Select.tsx` (options array, label, error display)
- [x] 3.4 Create `src/components/atoms/Spinner.tsx` (loading indicator with sm/md/lg sizes)
- [x] 3.5 Create `src/components/atoms/Badge.tsx` (color variants: green, gray, blue, red, yellow)
- [x] 3.6 Create `src/components/atoms/Modal.tsx` (portal rendering, overlay, escape/click-outside close)
- [x] 3.7 Create `src/components/molecules/SearchBar.tsx` (debounced onChange + explicit submit button)
- [x] 3.8 Create `src/components/molecules/ClientForm.tsx` (all fields, blur validation, submit handler)
- [x] 3.9 Create `src/components/molecules/ConfirmDialog.tsx` (modal wrapper with destructive variant)
- [x] 3.10 Create `src/components/molecules/Pagination.tsx` (prev/next, page info)
- [x] 3.11 Create `src/components/molecules/StatusBadge.tsx` (Badge wrapper: active=green, inactive=gray)

## Phase 4: Organisms & Pages (PR 3 ✅)

- [x] 4.1 Create `src/components/organisms/ClientTable.tsx` (paginated table with actions dropdown)
- [x] 4.2 Create `src/components/organisms/ClientDetailCard.tsx` (full client info display)
- [x] 4.3 Create `src/pages/ClientListPage.tsx` (table, search, empty state, loading, deactivate/reactivate)
- [x] 4.4 Create `src/pages/ClientCreatePage.tsx` (form with validation, redirect on success)
- [x] 4.5 Create `src/pages/ClientDetailPage.tsx` (detail + deactivate/reactivate, 404 handling)
- [x] 4.6 Create `src/pages/ClientEditPage.tsx` (pre-populated form, update + redirect)
- [x] 4.7 Wire routes in `src/App.tsx` (/, /clients, /clients/new, /clients/:id, /clients/:id/edit)

## Phase 5: Tests (PR 3 ✅)

- [x] 5.1 Write unit tests for `src/utils/validation.ts` and `src/services/client.ts`
- [x] 5.2 Write hook tests for useClients, useClient, useClientMutations (state transitions)
- [x] 5.3 Write component tests for Button, Modal, ClientForm, ClientTable, ClientListPage
- [x] 5.4 Add npm scripts (already existed: `test:frontend`, `test:frontend:watch`)
