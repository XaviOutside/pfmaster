import { getStorage } from '@/storage/storageContext';
import type { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import type { PaginatedResponse } from '@/types/pagination';

/**
 * Typed wrappers that delegate to the active storage implementation.
 * All functions return typed responses and throw HttpError on failure
 * (only when the ApiStorage backend is active).
 */

/** Fetch paginated list of non-deleted services with metadata. */
export function listServices(
  page = 1,
  limit = 20,
  petId?: number,
): Promise<PaginatedResponse<Service>> {
  const storage = getStorage();
  return storage.listServices(page, limit, petId);
}

/** Fetch a single service by ID. */
export function getService(id: number): Promise<Service> {
  const storage = getStorage();
  return storage.getService(id);
}

/** Create a new service. Returns the created service. */
export function createService(data: CreateServiceInput): Promise<Service> {
  const storage = getStorage();
  return storage.createService(data);
}

/** Update an existing service. Backend uses PUT. */
export function updateService(id: number, data: UpdateServiceInput): Promise<Service> {
  const storage = getStorage();
  return storage.updateService(id, data);
}

/** Soft-delete a service by ID. */
export function deleteService(id: number): Promise<void> {
  const storage = getStorage();
  return storage.deleteService(id);
}

/** Deactivate a service (set status = inactive). */
export function deactivateService(id: number): Promise<Service> {
  const storage = getStorage();
  return storage.deactivateService(id);
}

/** Search services by query string across name and description. */
export function searchServices(query: string): Promise<Service[]> {
  const storage = getStorage();
  return storage.searchServices(query);
}
