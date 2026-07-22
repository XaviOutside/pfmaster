import { getStorage } from '@/storage/storageContext';
import { HttpError } from '@/services/http';
import type { CompanySettings, UpdateSettingsDto } from '@/types/settings';

/**
 * Typed wrappers that delegate to the active storage implementation.
 * Singleton resource — no ID in the URL.
 */

/** Fetch current company settings. */
export function getSettings(): Promise<CompanySettings> {
  const storage = getStorage();
  return storage.getSettings();
}

/** Update company settings. All fields required. */
export function updateSettings(data: UpdateSettingsDto): Promise<CompanySettings> {
  const storage = getStorage();
  return storage.updateSettings(data);
}

/**
 * Upload company logo (PNG, max 1MB).
 *
 * This function uses direct fetch (not the storage abstraction) because
 * localStorage cannot store binary files and the upload endpoint requires
 * multipart/form-data which the http() wrapper does not support.
 * In demo mode this function is a no-op proxy.
 */
export async function uploadLogo(file: File): Promise<CompanySettings> {
  const storage = getStorage();
  return storage.uploadLogo(file);
}

export { HttpError };
