/**
 * Request DTO for updating an existing pet.
 * All fields are optional. status is intentionally excluded —
 * deactivation is handled exclusively via PATCH /:id/deactivate.
 * The id is extracted from the URL path, not the body.
 */
export interface UpdatePetDto {
  /** Updated name — optional */
  name?: string;
  /** Updated species — optional */
  species?: string;
  /** Updated breed — optional */
  breed?: string;
  /** Updated sex — optional string enum */
  sex?: 'unknown' | 'male' | 'female';
  /** Updated date of birth — optional ISO 8601 string, null to clear */
  dateOfBirth?: string | null;
  /** Updated weight in kg — optional, null to clear */
  weightKg?: number | null;
  /** Updated notes — optional, null to clear */
  notes?: string | null;
  /** Updated owner client id — optional, must be an active client */
  clientId?: number;
}
