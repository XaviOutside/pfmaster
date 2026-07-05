# Testing Capabilities — pfmaster

**Status**: CONFIGURED  
**Last Updated**: 2026-07-05  
**Detection Mode**: Full codebase scan

## Summary

This project has a mature Vitest setup across three layers: API unit tests (30), API integration tests (3), and frontend component/hook tests (27). Coverage is enforced at the API layer (80% lines threshold). E2E testing via Playwright is mandated by `AGENTS.md` but NOT yet installed or configured.

## Test Layers

| Layer | Framework | Runner | Coverage | Integrated | Notes |
|-------|-----------|--------|----------|------------|-------|
| API Unit | Vitest | `npm test` | ✅ 80% lines (v8) | ✅ | Config: `vitest.config.ts`, node env |
| API Integration | Vitest | `npm run test:integration` | ❌ | ✅ | Config: `vitest.integration.config.ts`, singleFork, 30s timeout, requires Docker MySQL |
| Frontend | Vitest + Testing Library | `npm run test:frontend` | ❌ | ✅ | Config: `vitest.frontend.config.ts`, jsdom env, `src/test-setup.ts` |
| E2E | Playwright (mandated) | N/A | ❌ | ❌ | **Not installed**. No `playwright` in `package.json`, no `e2e/` directory, no config file |

## Tools & Commands

| Tool | Status | Command | Notes |
|------|--------|---------|-------|
| Test Runner | ✅ Vitest 2.1.3 | `npm test` | API unit tests (default config) |
| API Unit | ✅ | `npm test` | `api/**/*.test.ts` (excl. integration) |
| API Integration | ✅ | `npm run test:integration` | `api/**/*.integration.test.ts`, sequential with 30s timeout |
| Frontend | ✅ | `npm run test:frontend` | `src/**/*.test.{ts,tsx}`, jsdom env |
| Frontend Watch | ✅ | `npm run test:frontend:watch` | Watch mode for TDD cycles |
| Coverage | ✅ | Runs with `npm test` | `@vitest/coverage-v8`, 80% lines threshold for API |
| Linter | ❌ Not Found | N/A | No ESLint config found |
| Formatter | ❌ Not Found | N/A | No Prettier config found |
| Type Checker | ✅ | `npm run build` | TypeScript `tsc` via `tsconfig.json` (strict mode) |
| E2E | ❌ Not Installed | N/A | Playwright mandated by AGENTS.md but missing from devDependencies |

## Test Counts

| Context | Unit Tests | Integration Tests | Total |
|---------|-----------|-------------------|-------|
| `api/clients/` | 7 | 1 | 8 |
| `api/pets/` | 8 | 1 | 9 |
| `api/services/` | 9 | 1 | 10 |
| `api/shared/` | 3 | 0 | 3 |
| `api/index.ts` | 1 | 0 | 1 |
| `src/components/` | 7 | 0 | 7 |
| `src/hooks/` | 7 | 0 | 7 |
| `src/pages/` | 7 | 0 | 7 |
| `src/services/` | 3 | 0 | 3 |
| `src/utils/` | 1 | 0 | 1 |
| **Total** | **53** | **3** | **56** |

## Strict TDD Support

**Enabled**: ✅ Yes  
**Reason**: Vitest test runner detected across 3 configs with 56 total tests. Coverage thresholds enforced.  
**Test Commands**:
- Unit/API: `npm test`
- Integration: `npm run test:integration` (Docker MySQL required)
- Frontend: `npm run test:frontend`
- Frontend watch: `npm run test:frontend:watch`
- All (if combined): run each suite separately — no unified command yet

## Frontend Testing Stack

- `@testing-library/react` — component rendering and queries
- `@testing-library/user-event` — user interaction simulation
- `@testing-library/jest-dom` — DOM matchers
- `jsdom` — browser environment simulation
- Setup: `src/test-setup.ts`

## E2E Gap

Playwright is specified in `AGENTS.md` as the E2E framework but is not yet installed:
- No `@playwright/test` in `package.json`
- No `playwright.config.ts` exists
- No `e2e/` directory exists
- No `npm run e2e` script

**Impact**: Strict TDD is enabled for unit/integration/frontend layers. The E2E gap does **not** block TDD cycles. It will block end-to-end verification in `sdd-verify` for changes that require E2E coverage.

## Next Steps

1. **Install Playwright** and configure `playwright.config.ts` to enable E2E testing
2. **Add `npm run e2e`** script to `package.json`
3. **Create `e2e/` directory** with critical user flows (create client → register pet → book service)
4. **Consider adding ESLint + Prettier** for code quality consistency
5. **Consider adding a unified test command** (`npm run test:all`) that runs all 3 Vitest suites
