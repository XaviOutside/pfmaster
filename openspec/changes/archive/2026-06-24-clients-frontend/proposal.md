# Proposal: Create the Clients Frontend

## Intent

The Clients API is fully built but has no UI. Users need a responsive web interface to manage clients — list, search, view, create, edit, deactivate, and soft-delete — to make the pet grooming business operational.

## Scope

### In Scope
- Full CRUD UI: list (paginated), detail, create, edit, deactivate, reactivate, soft-delete
- Debounced search (300ms auto + explicit button) via MySQL FTS backend
- Modal confirmations for destructive actions (deactivate, delete)
- Responsive layout: desktop + tablet
- Form validation (client-side on blur/submit + server error display)
- E2E tests for all client flows (Playwright)

### Out of Scope
- Bulk operations (multi-select, batch deactivate)
- Inline editing on the list page
- Import/export (CSV, PDF)
- Mobile-native optimizations (tablet-first, no phone breakpoint for v1)

## Capabilities

### New Capabilities
- `client-management-frontend`: Full frontend for client CRUD — pages, components, API integration, search, and routing

### Modified Capabilities
- None (no existing specs to modify)

## Approach

**Custom hooks + native fetch** for data fetching (Approach 2 from exploration). Service layer wraps `fetch` calls; hooks manage loading/error/data states. React Router v7 with dedicated pages (`/clients`, `/clients/new`, `/clients/:id`, `/clients/:id/edit`). Atomic Design component structure. Vite proxy (`server.proxy`) for CORS-free dev against `:3000`. TDD cycle mandatory (Red/Green/Refactor).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/` | New | Full frontend scaffold (types, services, hooks, components, pages, utils) |
| `index.html` | New | Vite HTML entry point |
| `vite.config.ts` | New | Vite config: React plugin, `@/` alias, dev proxy to `:3000` |
| `postcss.config.js` | New | PostCSS for Tailwind v4 |
| `package.json` | Modified | Add React 19, Vite, Tailwind v4, React Router v7, Playwright, dev deps |
| `tsconfig.json` | Modified | Add `jsx: "react-jsx"`, `lib: ["ES2022", "DOM", "DOM.Iterable"]` |
| `vitest.config.ts` | Modified | Add `jsdom` environment, include `src/**/*.test.{ts,tsx}` |
| `docker-compose.yml` | Modified | Add frontend `app` service (Vite dev on `:5173`) |
| `e2e/clients.spec.ts` | New | Playwright E2E tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tailwind v4 setup differs from v3 | Medium | Use `@import "tailwindcss"` CSS approach, no `tailwind.config.js` |
| React 19 + Router v7 compatibility | Medium | Lock compatible versions before scaffolding; verify in CI |
| CORS in dev | Low | Vite proxy (`server.proxy`) — no CORS config needed |

## Rollback Plan

- Revert `package.json`, `tsconfig.json`, `vitest.config.ts`, `docker-compose.yml` via git
- Delete `src/`, `index.html`, `vite.config.ts`, `postcss.config.js`
- No DB migrations to revert (frontend-only change)

## Dependencies

- Backend API running at `/api/v1/clients/` (fully built)
- React 19, React Router v7, Tailwind CSS v4, Vitest, Playwright — all via npm

## Success Criteria

- [ ] All CRUD pages load and function: list, create, edit, detail, deactivate, delete
- [ ] Search returns results within 300ms debounce + explicit button trigger
- [ ] Component tests pass (Vitest, >=80% coverage on business logic)
- [ ] E2E tests pass for full user flow (Playwright)
- [ ] Responsive layout renders correctly on desktop (1920px) and tablet (768px)
