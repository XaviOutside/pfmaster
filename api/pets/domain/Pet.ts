/**
 * Pet domain entity — zero framework or DB imports.
 * Sex values are stored as TINYINT in MySQL: 0 = unknown, 1 = male, 2 = female.
 * Status values are stored as TINYINT in MySQL: 0 = inactive, 1 = active.
 */
export type PetSex = 0 | 1 | 2;

export const PET_SEX = {
  UNKNOWN: 0 as PetSex,
  MALE: 1 as PetSex,
  FEMALE: 2 as PetSex,
} as const;

export type PetStatus = 0 | 1;

export const PET_STATUS = {
  INACTIVE: 0 as PetStatus,
  ACTIVE: 1 as PetStatus,
} as const;

export interface Pet {
  id: number;
  client_id: number;
  name: string;
  species: string;
  breed: string;
  sex: PetSex;
  dateOfBirth: Date | null;
  weightKg: number | null;
  notes: string | null;
  status: PetStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreatePetInput {
  client_id: number;
  name: string;
  species: string;
  breed: string;
  sex?: PetSex;
  dateOfBirth?: Date | null;
  weightKg?: number | null;
  notes?: string | null;
}

export interface UpdatePetInput {
  name?: string;
  species?: string;
  breed?: string;
  client_id?: number;
  sex?: PetSex;
  dateOfBirth?: Date | null;
  weightKg?: number | null;
  notes?: string | null;
  /** Only set by DeactivatePet use case — not exposed via UpdatePetDto */
  status?: PetStatus;
}
