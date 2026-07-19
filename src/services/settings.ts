import { http, HttpError } from '@/services/http';
import type { CompanySettings, UpdateSettingsDto } from '@/types/settings';

/**
 * Typed fetch wrappers for /api/v1/settings endpoints.
 * Singleton resource — no ID in the URL.
 */

/** Fetch current company settings. */
export function getSettings(): Promise<CompanySettings> {
  return http<CompanySettings>('/settings');
}

/** Update company settings. All fields required. */
export function updateSettings(data: UpdateSettingsDto): Promise<CompanySettings> {
  return http<CompanySettings>('/settings', {
    method: 'PUT',
    body: data,
  });
}

/** Upload company logo (PNG, max 1MB). Returns updated settings with logoUrl. */
export async function uploadLogo(file: File): Promise<CompanySettings> {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await fetch('/api/v1/settings/logo', {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type — browser sets it with multipart boundary
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new HttpError(response.status, error.error ?? 'Upload failed');
  }
  return response.json();
}

export { HttpError };
