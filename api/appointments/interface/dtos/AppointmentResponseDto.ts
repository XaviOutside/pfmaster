import { Appointment, AppointmentDetails, APPOINTMENT_STATUS_LABELS } from '../../domain/Appointment';

/**
 * Response DTO for appointment resources.
 *
 * Transforms a domain Appointment entity into the API response shape:
 *   - All Date fields → ISO 8601 strings
 *   - status is preserved as TINYINT (number), matching the domain convention
 *   - petName and clientName from joined details when available
 *   - Domain camelCase keys are preserved
 */
export interface AppointmentResponseDto {
  id: number;
  petId: number;
  petName: string;
  clientId: number;
  clientName: string;
  scheduledAt: string;
  status: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps a domain Appointment entity to an AppointmentResponseDto.
 * When given AppointmentDetails with joined names, petName and clientName are populated.
 * When given a plain Appointment, names default to empty strings.
 * Converts Date objects to ISO 8601 strings.
 */
export function toAppointmentResponseDto(
  appointment: Appointment | AppointmentDetails,
): AppointmentResponseDto {
  return {
    id: appointment.id,
    petId: appointment.petId,
    petName: (appointment as AppointmentDetails).petName ?? '',
    clientId: appointment.clientId,
    clientName: (appointment as AppointmentDetails).clientName ?? '',
    scheduledAt: appointment.scheduledAt.toISOString(),
    status: appointment.status,
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}
