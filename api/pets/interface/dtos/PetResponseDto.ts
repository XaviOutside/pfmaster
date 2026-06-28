import { Pet, PET_SEX, PET_STATUS } from '../../domain/Pet';

/**
 * Response DTO for pet resources.
 * - sex is human-readable ('unknown' | 'male' | 'female'), not the raw TINYINT.
 * - status is human-readable ('active' | 'inactive'), not the raw TINYINT.
 * - dateOfBirth / createdAt / updatedAt are ISO 8601 strings.
 * - deletedAt is intentionally omitted (internal soft-delete field).
 */
export interface PetResponseDto {
  id: number;
  clientId: number;
  name: string;
  species: string;
  breed: string;
  sex: 'unknown' | 'male' | 'female';
  dateOfBirth: string | null;
  weightKg: number | null;
  notes: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps a TINYINT sex value to its human-readable string label.
 */
function mapSex(sex: number): 'unknown' | 'male' | 'female' {
  switch (sex) {
    case PET_SEX.MALE:
      return 'male';
    case PET_SEX.FEMALE:
      return 'female';
    default:
      return 'unknown';
  }
}

/**
 * Maps a domain Pet entity to a PetResponseDto.
 * Converts TINYINT sex/status to human-readable strings and Date to ISO strings.
 */
export function toPetResponseDto(pet: Pet): PetResponseDto {
  return {
    id: pet.id,
    clientId: pet.client_id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    sex: mapSex(pet.sex),
    dateOfBirth: pet.dateOfBirth ? pet.dateOfBirth.toISOString().slice(0, 10) : null,
    weightKg: pet.weightKg,
    notes: pet.notes,
    status: pet.status === PET_STATUS.ACTIVE ? 'active' : 'inactive',
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
  };
}
