/**
 * Tests for toAppointmentResponseDto() mapper.
 *
 * Verifies that the mapper transforms a domain Appointment entity
 * into the API response shape:
 *   - Dates → ISO 8601 strings
 *   - TINYINT status → numeric status
 *   - Joined petName and clientName from details query
 *   - Domain camelCase keys preserved
 *   - No internal/deleted fields leaked
 */
import { describe, it, expect } from 'vitest';
import { APPOINTMENT_STATUS } from '../../domain/Appointment';
import type { Appointment } from '../../domain/Appointment';
import type { AppointmentDetails } from '../../domain/Appointment';

import { toAppointmentResponseDto } from './AppointmentResponseDto';

const domainAppointment: Appointment = {
  id: 1,
  petId: 7,
  clientId: 42,
  scheduledAt: new Date('2026-07-20T14:00:00.000Z'),
  status: APPOINTMENT_STATUS.PENDING,
  notes: 'First visit — check for matting',
  createdAt: new Date('2026-07-19T10:00:00.000Z'),
  updatedAt: new Date('2026-07-19T10:00:00.000Z'),
};

const domainAppointmentDetails: AppointmentDetails = {
  ...domainAppointment,
  petName: 'Max',
  clientName: 'Maria Garcia',
};

describe('toAppointmentResponseDto', () => {
  it('transforms a domain Appointment to response DTO shape', () => {
    const dto = toAppointmentResponseDto(domainAppointment);

    expect(dto).toMatchObject({
      id: 1,
      petId: 7,
      clientId: 42,
      scheduledAt: '2026-07-20T14:00:00.000Z',
      status: 0,
      notes: 'First visit — check for matting',
      createdAt: '2026-07-19T10:00:00.000Z',
      updatedAt: '2026-07-19T10:00:00.000Z',
    });
  });

  it('includes joined petName and clientName from AppointmentDetails', () => {
    const dto = toAppointmentResponseDto(domainAppointmentDetails);

    expect(dto.petName).toBe('Max');
    expect(dto.clientName).toBe('Maria Garcia');
  });

  it('petName and clientName are empty strings when not available', () => {
    const dto = toAppointmentResponseDto(domainAppointment);

    expect(dto.petName).toBe('');
    expect(dto.clientName).toBe('');
  });

  it('converts all Date fields to ISO 8601 strings', () => {
    const dto = toAppointmentResponseDto(domainAppointment);

    expect(typeof dto.scheduledAt).toBe('string');
    expect(typeof dto.createdAt).toBe('string');
    expect(typeof dto.updatedAt).toBe('string');
    expect(dto.scheduledAt).toBe('2026-07-20T14:00:00.000Z');
  });

  it('preserves TINYINT status as a number', () => {
    const confirmed: Appointment = {
      ...domainAppointment,
      id: 2,
      status: APPOINTMENT_STATUS.CONFIRMED,
    };

    const dto = toAppointmentResponseDto(confirmed);

    expect(dto.status).toBe(1);
    expect(typeof dto.status).toBe('number');
  });

  it('handles null notes correctly', () => {
    const noNotes: Appointment = {
      ...domainAppointment,
      id: 3,
      notes: null,
    };

    const dto = toAppointmentResponseDto(noNotes);

    expect(dto.notes).toBeNull();
  });

  it('does not leak internal domain fields', () => {
    const dto = toAppointmentResponseDto(domainAppointment);

    const keys = Object.keys(dto).sort();
    expect(keys).toEqual([
      'clientId',
      'clientName',
      'createdAt',
      'id',
      'notes',
      'petId',
      'petName',
      'scheduledAt',
      'status',
      'updatedAt',
    ]);
  });
});
