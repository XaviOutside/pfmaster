import { http, HttpError } from '@/services/http';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@/types/appointment';

/**
 * Typed fetch wrappers for /api/v1/appointments endpoints.
 */

/** Fetch appointments within a date range. */
export function listAppointments(start: string, end: string): Promise<Appointment[]> {
  const params = new URLSearchParams({ start, end });
  return http<Appointment[]>(`/appointments?${params.toString()}`);
}

/** Fetch a single appointment by ID. */
export function getAppointment(id: number): Promise<Appointment> {
  return http<Appointment>(`/appointments/${id}`);
}

/** Create a new appointment. Returns the created appointment. */
export function createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
  return http<Appointment>('/appointments', {
    method: 'POST',
    body: data,
  });
}

/** Update an existing appointment. Uses PATCH. */
export function updateAppointment(
  id: number,
  data: UpdateAppointmentDto,
): Promise<Appointment> {
  return http<Appointment>(`/appointments/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

/** Cancel an appointment (soft delete via status=3). Uses DELETE. */
export function cancelAppointment(id: number): Promise<Appointment> {
  return http<Appointment>(`/appointments/${id}`, {
    method: 'DELETE',
  });
}

export { HttpError };
