/**
 * Tests for GetAppointmentUseCase.
 *
 * Verifies:
 * - Existing appointment returned by ID
 * - Missing ID throws AppointmentNotFoundError
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAppointmentUseCase } from './GetAppointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import { Appointment, APPOINTMENT_STATUS } from '../domain/Appointment';
import { AppointmentNotFoundError } from '../domain/AppointmentErrors';

const mockAppointment: Appointment = {
  id: 5,
  petId: 7,
  clientId: 42,
  scheduledAt: new Date('2026-07-20T14:00:00Z'),
  status: APPOINTMENT_STATUS.PENDING,
  notes: null,
  createdAt: new Date('2026-07-19T17:00:00Z'),
  updatedAt: new Date('2026-07-19T17:00:00Z'),
};

function makeRepo(): IAppointmentRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockAppointment),
    findByDateRange: vi.fn(),
    existsByPetAndTime: vi.fn(),
    update: vi.fn(),
  };
}

describe('GetAppointmentUseCase', () => {
  let repo: IAppointmentRepository;
  let useCase: GetAppointmentUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new GetAppointmentUseCase(repo);
  });

  it('returns the appointment when found', async () => {
    const result = await useCase.execute(5);

    expect(result).toEqual(mockAppointment);
    expect(result.id).toBe(5);
    expect(repo.findById).toHaveBeenCalledWith(5);
  });

  it('throws AppointmentNotFoundError when appointment does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(AppointmentNotFoundError);
    await expect(useCase.execute(999)).rejects.toThrow('999');
  });

  it('calls findById with the correct id', async () => {
    await useCase.execute(42);

    expect(repo.findById).toHaveBeenCalledWith(42);
    expect(repo.findById).toHaveBeenCalledTimes(1);
  });
});
