/**
 * Tests for ListAppointmentsUseCase.
 *
 * Verifies:
 * - Date range filter returns correct subset
 * - Empty range returns []
 * - start >= end throws ValidationError
 * - Results ordered by the repository (ascending by scheduledAt)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListAppointmentsUseCase } from './ListAppointments';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import { Appointment, APPOINTMENT_STATUS } from '../domain/Appointment';
import { AppointmentValidationError } from '../domain/AppointmentErrors';

const jul20 = new Date('2026-07-20T00:00:00Z');
const jul21 = new Date('2026-07-21T00:00:00Z');
const _jul28 = new Date('2026-07-28T00:00:00Z');

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 1,
    petId: 7,
    clientId: 42,
    scheduledAt: jul20,
    status: APPOINTMENT_STATUS.PENDING,
    notes: null,
    createdAt: new Date('2026-07-19T17:00:00Z'),
    updatedAt: new Date('2026-07-19T17:00:00Z'),
    ...overrides,
  };
}

const appt20 = makeAppointment({ id: 1, scheduledAt: new Date('2026-07-20T10:00:00Z') });
const appt21 = makeAppointment({ id: 2, scheduledAt: new Date('2026-07-21T14:00:00Z') });
const appt28 = makeAppointment({ id: 3, scheduledAt: new Date('2026-07-28T09:00:00Z') });

const allAppointments = [appt20, appt21, appt28];

function makeRepo(): IAppointmentRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByDateRange: vi.fn().mockResolvedValue(allAppointments),
    existsByPetAndTime: vi.fn(),
    update: vi.fn(),
  };
}

describe('ListAppointmentsUseCase', () => {
  let repo: IAppointmentRepository;
  let useCase: ListAppointmentsUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new ListAppointmentsUseCase(repo);
  });

  it('returns appointments within the specified date range', async () => {
    vi.mocked(repo.findByDateRange).mockResolvedValue([appt20, appt21]);

    const result = await useCase.execute(jul20, new Date('2026-07-26T23:59:59Z'));

    expect(result).toHaveLength(2);
    expect(result).toEqual([appt20, appt21]);
    expect(repo.findByDateRange).toHaveBeenCalledWith(jul20, expect.any(Date));
  });

  it('returns empty array when no appointments in range', async () => {
    vi.mocked(repo.findByDateRange).mockResolvedValue([]);

    const result = await useCase.execute(jul20, jul21);

    expect(result).toEqual([]);
  });

  it('throws AppointmentValidationError when start is after end', async () => {
    await expect(
      useCase.execute(new Date('2026-07-28'), new Date('2026-07-20')),
    ).rejects.toThrow(AppointmentValidationError);

    await expect(
      useCase.execute(new Date('2026-07-28'), new Date('2026-07-20')),
    ).rejects.toThrow('start must be before end');
  });

  it('throws AppointmentValidationError when start equals end', async () => {
    await expect(
      useCase.execute(jul20, jul20),
    ).rejects.toThrow(AppointmentValidationError);

    expect(repo.findByDateRange).not.toHaveBeenCalled();
  });

  it('delegates to repository.findByDateRange with correct params', async () => {
    const start = new Date('2026-07-20T00:00:00Z');
    const end = new Date('2026-07-26T23:59:59Z');

    await useCase.execute(start, end);

    expect(repo.findByDateRange).toHaveBeenCalledWith(start, end);
  });
});
