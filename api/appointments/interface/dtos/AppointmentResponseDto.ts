import { Appointment, APPOINTMENT_STATUS_LABELS } from '../../domain/Appointment';

/**
 * Response DTO for appointment resources.
 *
 * Transforms a domain Appointment entity into the API response shape:
 *   - All Date fields → ISO 8601 strings
 *   - status is preserved as TINYINT (number), matching the domain convention
 *   - Domain camelCase keys are preserved
 */
export interface AppointmentResponseDto {
  id: number;
  petId: number;
  clientId: number;
  scheduledAt: string;
  status: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps a domain Appointment entity to an AppointmentResponseDto.
 * Converts Date objects to ISO 8601 strings.
 */
export function toAppointmentResponseDto(
  appointment: Appointment,
): AppointmentResponseDto {
  return {
    id: appointment.id,
    petId: appointment.petId,
    clientId: appointment.clientId,
    scheduledAt: appointment.scheduledAt.toISOString(),
    status: appointment.status,
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}
