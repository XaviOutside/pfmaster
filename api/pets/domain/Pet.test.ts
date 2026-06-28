import { describe, it, expect } from 'vitest';
import {
  PET_SEX,
  PET_STATUS,
  PetSex,
  PetStatus,
  type Pet,
  type CreatePetInput,
  type UpdatePetInput,
} from './Pet';

describe('PetSex enum', () => {
  it('should map 0 to UNKNOWN', () => {
    expect(PET_SEX.UNKNOWN).toBe(0);
  });

  it('should map 1 to MALE', () => {
    expect(PET_SEX.MALE).toBe(1);
  });

  it('should map 2 to FEMALE', () => {
    expect(PET_SEX.FEMALE).toBe(2);
  });

  it('should accept valid sex values', () => {
    const valid: PetSex[] = [0, 1, 2];
    valid.forEach((v) => {
      const found = Object.values(PET_SEX).includes(v as PetSex);
      expect(found).toBe(true);
    });
  });
});

describe('PetStatus enum', () => {
  it('should map 0 to INACTIVE', () => {
    expect(PET_STATUS.INACTIVE).toBe(0);
  });

  it('should map 1 to ACTIVE', () => {
    expect(PET_STATUS.ACTIVE).toBe(1);
  });

  it('should accept valid status values', () => {
    const valid: PetStatus[] = [0, 1];
    valid.forEach((v) => {
      const found = Object.values(PET_STATUS).includes(v as PetStatus);
      expect(found).toBe(true);
    });
  });
});

describe('Pet entity (compile-time type verification)', () => {
  it('should allow a valid Pet object', () => {
    const pet: Pet = {
      id: 1,
      client_id: 42,
      name: 'Rex',
      species: 'Dog',
      breed: 'German Shepherd',
      sex: PET_SEX.MALE,
      dateOfBirth: null,
      weightKg: 30.5,
      notes: null,
      status: PET_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    expect(pet.id).toBe(1);
    expect(pet.name).toBe('Rex');
    expect(pet.sex).toBe(1);
    expect(pet.status).toBe(1);
  });

  it('should allow nullable fields to be null', () => {
    const pet: Pet = {
      id: 2,
      client_id: 10,
      name: 'Bella',
      species: 'Cat',
      breed: 'Persian',
      sex: PET_SEX.FEMALE,
      dateOfBirth: null,
      weightKg: null,
      notes: null,
      status: PET_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    expect(pet.weightKg).toBeNull();
    expect(pet.dateOfBirth).toBeNull();
    expect(pet.notes).toBeNull();
  });
});

describe('CreatePetInput', () => {
  it('should accept minimal required fields', () => {
    const input: CreatePetInput = {
      client_id: 42,
      name: 'Rex',
      species: 'Dog',
      breed: 'Labrador',
    };
    expect(input.name).toBe('Rex');
    expect(input.client_id).toBe(42);
  });

  it('should accept all optional fields', () => {
    const input: CreatePetInput = {
      client_id: 1,
      name: 'Bella',
      species: 'Cat',
      breed: 'Siamese',
      sex: PET_SEX.FEMALE,
      dateOfBirth: new Date('2020-01-15'),
      weightKg: 4.2,
      notes: 'Friendly cat',
    };
    expect(input.sex).toBe(2);
    expect(input.weightKg).toBe(4.2);
  });
});

describe('UpdatePetInput', () => {
  it('should allow partial updates with no fields', () => {
    const input: UpdatePetInput = {};
    expect(input).toEqual({});
  });

  it('should allow updating name only', () => {
    const input: UpdatePetInput = { name: 'Max' };
    expect(input.name).toBe('Max');
  });

  it('should allow internal status field', () => {
    const input: UpdatePetInput = { status: PET_STATUS.INACTIVE };
    expect(input.status).toBe(0);
  });
});
