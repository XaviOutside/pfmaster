/**
 * Frontend types for the Settings domain.
 * Mirrors the backend SettingsResponseDto returned by /api/v1/settings.
 */

/** Language enum: 0 = English, 1 = Spanish. */
export type Lang = 0 | 1;

/**
 * Company settings entity as returned by the API.
 * - workdays: array of day numbers 1–7 (Mon–Sun)
 * - workStartTime / workEndTime: HH:MM format
 * - createdAt / updatedAt: ISO 8601 strings
 */
export interface CompanySettings {
  id: number;
  companyName: string;
  tagline: string | null;
  workdays: number[];
  workStartTime: string;
  workEndTime: string;
  defaultLang: Lang;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for updating company settings. All fields required. */
export interface UpdateSettingsDto {
  companyName: string;
  tagline?: string | null;
  workdays: number[];
  workStartTime: string;
  workEndTime: string;
  defaultLang: Lang;
}

/** Mapping from Lang enum to i18next language code. */
export const LANG_MAP: Record<Lang, 'en' | 'es'> = {
  0: 'en',
  1: 'es',
};

/** Reverse mapping from i18next language code to Lang enum. */
export const LANG_REVERSE_MAP: Record<'en' | 'es', Lang> = {
  en: 0,
  es: 1,
};
