import { getStorage } from '@/storage/storageContext';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@/types/appointment';

export { HttpError } from '@/services/http';

/**
 * Typed wrappers that delegate to the active storage implementation.
 */

/** Fetch appointments within a date range. */
export function listAppointments(start: string, end: string): Promise<Appointment[]> {
  const storage = getStorage();
  return storage.listAppointments(start, end);
}

/** Fetch a single appointment by ID. */
export function getAppointment(id: number): Promise<Appointment> {
  const storage = getStorage();
  return storage.getAppointment(id);
}

/** Create a new appointment. Returns the created appointment. */
export function createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
  const storage = getStorage();
  return storage.createAppointment(data);
}

/** Update an existing appointment. Uses PATCH. */
export function updateAppointment(
  id: number,
  data: UpdateAppointmentDto,
): Promise<Appointment> {
  const storage = getStorage();
  return storage.updateAppointment(id, data);
}

/** Cancel an appointment (soft delete via status=3). Uses DELETE. */
export function cancelAppointment(id: number): Promise<Appointment> {
  const storage = getStorage();
  return storage.cancelAppointment(id);
}
