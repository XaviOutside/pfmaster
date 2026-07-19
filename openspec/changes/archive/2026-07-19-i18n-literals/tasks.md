# Tasks: i18n Literal Extraction

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,500 (12 locale JSONs: ~750, 45 modified prod files: ~400, 35 test files: ~200, 14 new non-JSON files: ~155) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Infrastructure: install deps, 12 locale JSONs, i18n.ts config, test mock, I18nextProvider, format/validation refactor, useModuleTabs | PR 1 | ~770 lines; pure additive; base = main |
| 2 | Shared components + organisms: DataTable, Pagination, StatusBadge, ConfirmDialog, ModuleTabs, PageHeader, Sidebar, MobileNav, detail cards, tables | PR 2 | ~380 lines; depends on PR 1 locale files |
| 3 | Pages + forms + LanguageSwitcher + all test updates: 15 pages, ClientForm/PetForm/ServiceForm/SearchInput/Modal, LanguageSwitcher, 35 test files | PR 3 | ~450 lines; depends on PR 2 shared refactor |

## Phase 1: Infrastructure (PR 1)

- [x] 1.1 Install `react-i18next`, `i18next`, `i18next-browser-languagedetector` in `package.json`
- [x] 1.2 Create `src/i18n.ts` — init i18next with language detection, `en` fallback, `<html lang>` sync, load 6 namespaces
- [x] 1.3 Create `src/locales/en/common.json` — nav, actions, status, pagination, empty states, a11y labels, 404, brand
- [x] 1.4 Create `src/locales/es/common.json` — Spanish mirror (preserve existing Spanish text)
- [x] 1.5 Create `src/locales/en/landing.json` — hero, features grid, footer
- [x] 1.6 Create `src/locales/es/landing.json` — Spanish landing copy
- [x] 1.7 Create `src/locales/en/clients.json` + `src/locales/es/clients.json` — list/table, form, detail, deactivate
- [x] 1.8 Create `src/locales/en/pets.json` + `src/locales/es/pets.json` — list, form, detail, sex labels, weight
- [x] 1.9 Create `src/locales/en/services.json` + `src/locales/es/services.json` — list, form, detail, duration/price
- [x] 1.10 Create `src/locales/en/validation.json` + `src/locales/es/validation.json` — required, email, phone, date, weight, length
- [x] 1.11 Create `src/test-utils/i18n.ts` — `useTranslation` mock returning `t: (key) => key`
- [x] 1.12 Modify `src/test-setup.ts` — import `./test-utils/i18n`
- [x] 1.13 Modify `src/main.tsx` — import i18n config, wrap App with `I18nextProvider`
- [x] 1.14 Refactor `src/utils/format.ts` — add locale param to `formatDate`, extract `formatSex`, unify `formatDuration` with `t` function
- [x] 1.15 Refactor `src/utils/validation.ts` — return keys instead of English strings
- [x] 1.16 Create `src/hooks/useModuleTabs.ts` — deduplicate MODULE_TABS with `t()`-based labels

## Phase 2: Shared Components + Organisms (PR 2)

- [x] 2.1 Replace strings in `src/components/molecules/StatusBadge.tsx` → `t('common.status.*')`
- [x] 2.2 Replace strings in `src/components/molecules/ConfirmDialog.tsx` → `t('common.actions.*')`
- [x] 2.3 Replace strings in `src/components/molecules/Pagination.tsx` → `t('common.pagination.*')` with interpolation
- [x] 2.4 Replace strings in `src/components/molecules/ModuleTabs.tsx` → use `useModuleTabs` hook
- [x] 2.5 Replace strings in `src/components/organisms/DataTable.tsx` → actions, empty, error, aria-labels
- [x] 2.6 Replace strings in `src/components/organisms/PageHeader.tsx` → aria-labels
- [x] 2.7 Replace strings in `src/components/organisms/Sidebar.tsx` → `t('common.navigation.*')`
- [x] 2.8 Replace strings in `src/components/organisms/MobileNav.tsx` → separate `mobileNav` keys
- [x] 2.9 Replace strings in `src/components/organisms/ClientTable.tsx` → column headers
- [x] 2.10 Replace strings in `src/components/organisms/PetTable.tsx` → column headers
- [x] 2.11 Replace strings in `src/components/organisms/ServiceTable.tsx` → column headers
- [x] 2.12 Replace strings in `src/components/organisms/ClientDetailCard.tsx` → field labels, buttons
- [x] 2.13 Replace strings in `src/components/organisms/PetDetailCard.tsx` → field labels, `formatSex` → `t()`, localized `formatWeight`
- [x] 2.14 Replace strings in `src/components/organisms/ServiceDetailCard.tsx` → `formatDuration` → `t()`

## Phase 3: Pages, Forms, LanguageSwitcher + Tests (PR 3)

- [x] 3.1 Replace strings in `src/components/molecules/ClientForm.tsx` → labels, placeholders → `t('clients.form.*')`
- [x] 3.2 Replace strings in `src/components/molecules/PetForm.tsx` → labels, placeholders → `t('pets.form.*')`
- [x] 3.3 Replace strings in `src/components/molecules/ServiceForm.tsx` → labels, placeholders → `t('services.form.*')`
- [x] 3.4 Replace strings in `src/components/molecules/SearchInput.tsx` → placeholder, aria-label
- [x] 3.5 Replace strings in `src/components/atoms/Modal.tsx` → default aria-label
- [x] 3.6 Replace strings in `src/pages/LandingPage.tsx` → `t('landing.*')`
- [x] 3.7 Replace strings in `src/pages/RegisterPage.tsx` → labels
- [x] 3.8 Replace strings in `src/pages/ClientsPage.tsx` — tabs, columns, search, button, deactivate dialog
- [x] 3.9 Replace strings in `src/pages/ClientCreatePage.tsx`, `ClientEditPage.tsx`, `ClientDetailPage.tsx`
- [x] 3.10 Replace strings in `src/pages/PetsPage.tsx`, `PetCreatePage.tsx`, `PetEditPage.tsx`, `PetDetailPage.tsx`
- [x] 3.11 Replace strings in `src/pages/ServicesPage.tsx`, `ServiceCreatePage.tsx`, `ServiceEditPage.tsx`, `ServiceDetailPage.tsx`
- [x] 3.12 Extract `NotFoundPage` 404 strings in `src/App.tsx` → `t('common.notFound.*')`
- [x] 3.13 Create `src/components/molecules/LanguageSwitcher.tsx` — es/en dropdown atom
- [x] 3.14 Place `LanguageSwitcher` in sidebar footer
- [x] 3.15 Update all 10 organism test files → key-based assertions
- [x] 3.16 Update all 7 molecule test files → key-based assertions
- [x] 3.17 Update all 11 page test files → key-based assertions
- [x] 3.18 Update `format.test.ts` + `validation.test.ts` → reflect locale-aware API + key returns
- [x] 3.19 Update 2 template test files → wrap with I18nextProvider or rely on mock

## Phase 4: Verify

- [x] 4.1 Run `npm run build` — zero errors
- [x] 4.2 Run `npm test` — 243/243 pass (30 test files, zero failures)
- [x] 4.3 Run `npm run lint` — 6 pre-existing errors in i18n-changed files, 16 in non-i18n files (C1 regression corrected)
- [x] 4.4 Grep audit for remaining hardcoded Spanish/English text in JSX — zero found
- [x] 4.5 Verify key parity: every `es` key exists in `en` and vice versa — 259/259 perfect parity
- [x] 4.6 Verify Material Symbols icon names untouched — 22 references preserved
