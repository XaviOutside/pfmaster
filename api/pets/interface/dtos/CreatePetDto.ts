/**
 * Request DTO for creating a new pet.
 * Fields use camelCase for the API boundary — the controller maps to
 * snake_case domain inputs before passing to the use case.
 */
export interface CreatePetDto {
  /** Pet name — required, 1-100 chars (validated in use case) */
  name: string;
  /** Species — required, 1-100 chars (validated in use case) */
  species: string;
  /** Breed — optional */
  breed?: string;
  /** Sex — optional string enum, mapped to TINYINT by controller */
  sex?: 'unknown' | 'male' | 'female';
  /** Date of birth — optional ISO 8601 date string */
  dateOfBirth?: string | null;
  /** Weight in kg — optional, stored as DECIMAL(5,2) */
  weightKg?: number | null;
  /** Free-text notes — optional */
  notes?: string | null;
  /** Owner client id — required, must be an active client */
  clientId: number;
}
