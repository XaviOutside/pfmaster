/**
 * Tests for CreateAppointmentUseCase.
 *
 * Verifies:
 * - Successful creation (pet exists, no conflict, valid notes)
 * - Pet not found → AppointmentNotFoundError
 * - Double-booking → AppointmentConflictError
 * - Notes > 500 chars → AppointmentValidationError
 * - client_id denormalized from pet entity
 * - ScheduledAt + notes passed through to repository
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateAppointmentUseCase } from './CreateAppointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import { IPetRepository } from '../../pets/domain/IPetRepository';
import { Appointment, AppointmentStatus, APPOINTMENT_STATUS } from '../domain/Appointment';
import { AppointmentNotFoundError, AppointmentValidationError, AppointmentConflictError } from '../domain/AppointmentErrors';
import { Pet, PetSex, PetStatus } from '../../pets/domain/Pet';
import { MAX_NOTES_LENGTH } from '../domain/Appointment';

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockPet: Pet = {
  id: 7,
  client_id: 42,
  name: 'Max',
  species: 'Dog',
  breed: 'Labrador',
  sex: 1 as PetSex,
  dateOfBirth: null,
  weightKg: null,
  notes: null,
  status: 1 as PetStatus,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

const scheduledAt = new Date('2026-07-20T14:00:00Z');

const mockAppointment: Appointment = {
  id: 1,
  petId: 7,
  clientId: 42,
  scheduledAt,
  status: APPOINTMENT_STATUS.PENDING,
  notes: null,
  createdAt: new Date('2026-07-19T17:00:00Z'),
  updatedAt: new Date('2026-07-19T17:00:00Z'),
};

function makeAppointmentRepo(): IAppointmentRepository {
  return {
    create: vi.fn().mockResolvedValue(mockAppointment),
    findById: vi.fn(),
    findByDateRange: vi.fn(),
    existsByPetAndTime: vi.fn().mockResolvedValue(false),
    update: vi.fn(),
  };
}

function makePetRepo(): IPetRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockPet),
    existsById: vi.fn(),
    findAll: vi.fn(),
    findAllByClientId: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    search: vi.fn(),
    clientExistsAndIsActive: vi.fn(),
    deactivateAllByClientId: vi.fn(),
    softDeleteAllByClientId: vi.fn(),
  };
}

// ─── CreateAppointmentUseCase ──────────────────────────────────────────────────

describe('CreateAppointmentUseCase', () => {
  let appointmentRepo: IAppointmentRepository;
  let petRepo: IPetRepository;
  let useCase: CreateAppointmentUseCase;

  beforeEach(() => {
    appointmentRepo = makeAppointmentRepo();
    petRepo = makePetRepo();
    useCase = new CreateAppointmentUseCase(appointmentRepo, petRepo);
  });

  // ── Success cases ──────────────────────────────────────────────────────────

  it('creates an appointment with status PENDING by default', async () => {
    vi.mocked(petRepo.findById).mockResolvedValue(mockPet);
    vi.mocked(appointmentRepo.existsByPetAndTime).mockResolvedValue(false);
    vi.mocked(appointmentRepo.create).mockResolvedValue(mockAppointment);

    const result = await useCase.execute({
      petId: 7,
      scheduledAt,
      notes: null,
    });

    expect(result.status).toBe(APPOINTMENT_STATUS.PENDING);
    expect(result.petId).toBe(7);
    expect(result.clientId).toBe(42);
    expect(result.scheduledAt).toEqual(scheduledAt);
  });

  it('denormalizes clientId from the pet entity', async () => {
    const petWithDifferentClient: Pet = { ...mockPet, client_id: 99 };
    vi.mocked(petRepo.findById).mockResolvedValue(petWithDifferentClient);

    const createdAppointment: Appointment = { ...mockAppointment, clientId: 99 };
    vi.mocked(appointmentRepo.create).mockResolvedValue(createdAppointment);

    const result = await useCase.execute({
      petId: 7,
      scheduledAt,
    });

    expect(result.clientId).toBe(99);
    expect(appointmentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 99 }),
    );
  });

  it('accepts valid notes (≤ 500 chars)', async () => {
    const notes = 'Use hypoallergenic shampoo';
    vi.mocked(appointmentRepo.create).mockResolvedValue({
      ...mockAppointment,
      notes,
    });

    const result = await useCase.execute({
      petId: 7,
      scheduledAt,
      notes,
    });

    expect(result.notes).toBe(notes);
    expect(appointmentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ notes }),
    );
  });

  it('accepts null notes', async () => {
    const result = await useCase.execute({
      petId: 7,
      scheduledAt,
      notes: null,
    });

    expect(result.notes).toBeNull();
  });

  it('passes correct data to repository.create', async () => {
    await useCase.execute({
      petId: 7,
      scheduledAt,
      notes: 'Test notes',
    });

    expect(appointmentRepo.create).toHaveBeenCalledTimes(1);
    expect(appointmentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        petId: 7,
        clientId: 42,
        scheduledAt,
        notes: 'Test notes',
      }),
    );
  });

  // ── Pet not found → 404 ────────────────────────────────────────────────────

  it('throws AppointmentNotFoundError when pet does not exist', async () => {
    vi.mocked(petRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ petId: 999, scheduledAt }),
    ).rejects.toThrow(AppointmentNotFoundError);

    await expect(
      useCase.execute({ petId: 999, scheduledAt }),
    ).rejects.toThrow('999');
  });

  // ── Double-booking → 409 ───────────────────────────────────────────────────

  it('throws AppointmentConflictError when pet already booked at same time', async () => {
    vi.mocked(appointmentRepo.existsByPetAndTime).mockResolvedValue(true);

    await expect(
      useCase.execute({ petId: 7, scheduledAt }),
    ).rejects.toThrow(AppointmentConflictError);

    await expect(
      useCase.execute({ petId: 7, scheduledAt }),
    ).rejects.toThrow('already has an appointment');
  });

  it('does NOT call create when conflict is detected', async () => {
    vi.mocked(appointmentRepo.existsByPetAndTime).mockResolvedValue(true);

    await expect(
      useCase.execute({ petId: 7, scheduledAt }),
    ).rejects.toThrow(AppointmentConflictError);

    expect(appointmentRepo.create).not.toHaveBeenCalled();
  });

  // ── Notes validation ───────────────────────────────────────────────────────

  it('throws AppointmentValidationError when notes exceed 500 characters', async () => {
    const longNotes = 'A'.repeat(MAX_NOTES_LENGTH + 1);

    await expect(
      useCase.execute({ petId: 7, scheduledAt, notes: longNotes }),
    ).rejects.toThrow(AppointmentValidationError);

    await expect(
      useCase.execute({ petId: 7, scheduledAt, notes: longNotes }),
    ).rejects.toThrow('must not exceed');
  });

  it('accepts notes exactly at 500 characters', async () => {
    const exactNotes = 'A'.repeat(MAX_NOTES_LENGTH);
    vi.mocked(appointmentRepo.create).mockResolvedValue({
      ...mockAppointment,
      notes: exactNotes,
    });

    const result = await useCase.execute({
      petId: 7,
      scheduledAt,
      notes: exactNotes,
    });

    expect(result.notes).toBe(exactNotes);
  });

  // ── Verify pet fetch ───────────────────────────────────────────────────────

  it('calls petRepo.findById with the correct petId', async () => {
    await useCase.execute({ petId: 42, scheduledAt });

    expect(petRepo.findById).toHaveBeenCalledWith(42);
  });
});
