/**
 * Frontend types for the Appointment domain.
 * Mirrors the backend DTOs returned by /api/v1/appointments.
 */

/** Status enum: 0=pending, 1=confirmed, 2=completed, 3=cancelled */
export type AppointmentStatus = 0 | 1 | 2 | 3;

/** Mapping from numeric status to display labels. */
export const APPOINTMENT_STATUS_MAP: Record<AppointmentStatus, string> = {
  0: 'pending',
  1: 'confirmed',
  2: 'completed',
  3: 'cancelled',
} as const;

/** Appointment entity as returned by the API. */
export interface Appointment {
  id: number;
  petId: number;
  petName: string;
  clientId: number;
  clientName: string;
  scheduledAt: string; // ISO 8601
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new appointment. */
export interface CreateAppointmentDto {
  petId: number;
  scheduledAt: string; // ISO 8601
  notes?: string;
}

/** Payload for updating an existing appointment. All fields optional. */
export interface UpdateAppointmentDto {
  scheduledAt?: string;
  notes?: string | null;
  status?: AppointmentStatus;
}
