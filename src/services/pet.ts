import { getStorage } from '@/storage/storageContext';
import type { Pet, CreatePetInput, UpdatePetInput } from '@/types/pet';
import type { PaginatedResponse } from '@/types/pagination';

/**
 * Typed wrappers that delegate to the active storage implementation.
 * All functions return typed responses and throw HttpError on failure
 * (only when the ApiStorage backend is active).
 */

/** Fetch paginated list of pets with metadata, optionally filtered by client. */
export function listPets(
  page = 1,
  limit = 20,
  clientId?: number,
): Promise<PaginatedResponse<Pet>> {
  const storage = getStorage();
  return storage.listPets(page, limit, clientId);
}

/** Fetch a single pet by ID. */
export function getPet(id: number): Promise<Pet> {
  const storage = getStorage();
  return storage.getPet(id);
}

/** Create a new pet. Returns the created pet. */
export function createPet(data: CreatePetInput): Promise<Pet> {
  const storage = getStorage();
  return storage.createPet(data);
}

/** Update an existing pet. Backend uses PUT. */
export function updatePet(id: number, data: UpdatePetInput): Promise<Pet> {
  const storage = getStorage();
  return storage.updatePet(id, data);
}

/** Soft-delete a pet by ID. */
export function deletePet(id: number): Promise<void> {
  const storage = getStorage();
  return storage.deletePet(id);
}

/** Deactivate a pet (set status = inactive). */
export function deactivatePet(id: number): Promise<Pet> {
  const storage = getStorage();
  return storage.deactivatePet(id);
}

/** Search pets by query string across name, breed, and notes. */
export function searchPets(query: string): Promise<Pet[]> {
  const storage = getStorage();
  return storage.searchPets(query);
}
