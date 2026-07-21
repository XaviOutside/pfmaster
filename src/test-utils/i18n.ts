import { vi } from 'vitest';

/**
 * Mock useTranslation from react-i18next.
 * Returns t: (key) => key so tests pass with raw key strings.
 * Use this in test files that mount components using useTranslation().
 *
 * The `t` function has a STABLE identity across renders: components that list
 * `t` in effect dependencies must not re-run effects on every render.
 */
const t = (key: string): string => key;
const changeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t,
    i18n: {
      language: 'en',
      changeLanguage,
    },
  }),
}));
