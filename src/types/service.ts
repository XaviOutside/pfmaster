/**
 * Frontend types for the Service domain.
 * Mirrors the backend ServiceResponseDto shape returned by /api/v1/services.
 *
 * TINYINT enum is mapped to string union per the DTO layer:
 * - status: DB TINYINT(0/1) → DTO 'active' | 'inactive'
 * - price: DB INT cents → DTO dollars (number)
 */
export type ServiceStatus = 'active' | 'inactive';

/**
 * Service entity as returned by the API.
 * - price is in dollars (e.g. 50.00)
 * - durationMinutes is nullable
 * - deletedAt is never exposed by the DTO
 */
export interface Service {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  price: number;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new service via POST /api/v1/services. */
export interface CreateServiceInput {
  name: string;
  description?: string;
  durationMinutes?: number;
  price: number;
}

/** Payload for updating an existing service via PUT /api/v1/services/:id. */
export interface UpdateServiceInput {
  name?: string;
  description?: string | null;
  durationMinutes?: number | null;
  price?: number;
}
