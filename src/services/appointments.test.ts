/**
 * Tests for appointments API service.
 * Mirrors the pattern from client.test.ts — mock fetch, verify HTTP calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from './appointments';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const mockAppointment = {
  id: 1,
  petId: 7,
  petName: 'Max',
  clientId: 42,
  clientName: 'Maria Garcia',
  scheduledAt: '2026-07-20T14:00:00.000Z',
  status: 0,
  notes: 'First visit',
  createdAt: '2026-07-19T10:00:00.000Z',
  updatedAt: '2026-07-19T10:00:00.000Z',
};

describe('listAppointments', () => {
  it('fetches appointments with date range params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([mockAppointment]),
    });

    const start = '2026-07-20';
    const end = '2026-07-26';
    const result = await listAppointments(start, end);

    expect(result).toEqual([mockAppointment]);
    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/appointments?start=2026-07-20&end=2026-07-26',
      expect.anything(),
    );
  });

  it('returns empty array when no appointments', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    const result = await listAppointments('2026-07-20', '2026-07-26');
    expect(result).toEqual([]);
  });

  it('throws HttpError on server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    await expect(
      listAppointments('2026-07-20', '2026-07-26'),
    ).rejects.toThrow('Internal server error');
  });
});

describe('getAppointment', () => {
  it('fetches a single appointment by id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockAppointment),
    });

    const result = await getAppointment(1);
    expect(result).toEqual(mockAppointment);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/appointments/1',
      expect.anything(),
    );
  });

  it('throws HttpError on 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Appointment not found' }),
    });

    await expect(getAppointment(999)).rejects.toThrow('Appointment not found');
  });
});

describe('createAppointment', () => {
  it('POSTs appointment data and returns the created entity', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockAppointment),
    });

    const dto = {
      petId: 7,
      scheduledAt: '2026-07-20T14:00:00.000Z',
      notes: 'First visit',
    };

    const result = await createAppointment(dto);

    expect(result).toEqual(mockAppointment);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/appointments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    );
  });

  it('throws HttpError with conflict message on 409', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Pet already booked' }),
    });

    await expect(
      createAppointment({ petId: 7, scheduledAt: '2026-07-20T14:00:00.000Z' }),
    ).rejects.toThrow('Pet already booked');
  });
});

describe('updateAppointment', () => {
  it('PATCHes appointment data and returns updated entity', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...mockAppointment, status: 1 }),
    });

    const result = await updateAppointment(1, { status: 1 });

    expect(result.status).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/appointments/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 1 }),
      }),
    );
  });
});

describe('cancelAppointment', () => {
  it('DELETE cancels an appointment', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...mockAppointment, status: 3 }),
    });

    const result = await cancelAppointment(1);

    expect(result.status).toBe(3);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/appointments/1',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});
