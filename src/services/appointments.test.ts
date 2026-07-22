import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from './appointments';

const mockStorage = {
  listAppointments: vi.fn(),
  getAppointment: vi.fn(),
  createAppointment: vi.fn(),
  updateAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
};

vi.mock('@/storage/storageContext', () => ({
  getStorage: () => mockStorage,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const mockAppointment = {
  id: 1,
  petId: 7,
  petName: 'Max',
  clientId: 42,
  clientName: 'Maria Garcia',
  scheduledAt: '2026-07-20T14:00:00.000Z',
  status: 0 as const,
  notes: 'First visit',
  createdAt: '2026-07-19T10:00:00.000Z',
  updatedAt: '2026-07-19T10:00:00.000Z',
};

describe('listAppointments', () => {
  it('delegates to storage.listAppointments with date range', async () => {
    mockStorage.listAppointments.mockResolvedValueOnce([mockAppointment]);

    const start = '2026-07-20';
    const end = '2026-07-26';
    const result = await listAppointments(start, end);

    expect(result).toEqual([mockAppointment]);
    expect(result).toHaveLength(1);
    expect(mockStorage.listAppointments).toHaveBeenCalledWith(start, end);
  });

  it('returns empty array when no appointments', async () => {
    mockStorage.listAppointments.mockResolvedValueOnce([]);

    const result = await listAppointments('2026-07-20', '2026-07-26');
    expect(result).toEqual([]);
  });

  it('propagates error from storage', async () => {
    mockStorage.listAppointments.mockRejectedValueOnce(new Error('Internal server error'));

    await expect(
      listAppointments('2026-07-20', '2026-07-26'),
    ).rejects.toThrow('Internal server error');
  });
});

describe('getAppointment', () => {
  it('delegates to storage.getAppointment by id', async () => {
    mockStorage.getAppointment.mockResolvedValueOnce(mockAppointment);

    const result = await getAppointment(1);
    expect(result).toEqual(mockAppointment);
    expect(mockStorage.getAppointment).toHaveBeenCalledWith(1);
  });

  it('propagates 404 error from storage', async () => {
    mockStorage.getAppointment.mockRejectedValueOnce(new Error('Appointment not found'));

    await expect(getAppointment(999)).rejects.toThrow('Appointment not found');
  });
});

describe('createAppointment', () => {
  it('delegates to storage.createAppointment with dto', async () => {
    mockStorage.createAppointment.mockResolvedValueOnce(mockAppointment);

    const dto = {
      petId: 7,
      scheduledAt: '2026-07-20T14:00:00.000Z',
      notes: 'First visit',
    };

    const result = await createAppointment(dto);

    expect(result).toEqual(mockAppointment);
    expect(mockStorage.createAppointment).toHaveBeenCalledWith(dto);
  });

  it('propagates conflict error from storage', async () => {
    mockStorage.createAppointment.mockRejectedValueOnce(new Error('Pet already booked'));

    await expect(
      createAppointment({ petId: 7, scheduledAt: '2026-07-20T14:00:00.000Z' }),
    ).rejects.toThrow('Pet already booked');
  });
});

describe('updateAppointment', () => {
  it('delegates to storage.updateAppointment with id and dto', async () => {
    mockStorage.updateAppointment.mockResolvedValueOnce({ ...mockAppointment, status: 1 as const });

    const result = await updateAppointment(1, { status: 1 });

    expect(result.status).toBe(1);
    expect(mockStorage.updateAppointment).toHaveBeenCalledWith(1, { status: 1 });
  });
});

describe('cancelAppointment', () => {
  it('delegates to storage.cancelAppointment', async () => {
    mockStorage.cancelAppointment.mockResolvedValueOnce({ ...mockAppointment, status: 3 as const });

    const result = await cancelAppointment(1);

    expect(result.status).toBe(3);
    expect(mockStorage.cancelAppointment).toHaveBeenCalledWith(1);
  });
});
