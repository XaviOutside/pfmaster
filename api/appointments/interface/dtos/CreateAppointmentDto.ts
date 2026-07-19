/**
 * Request DTO for creating a new appointment.
 *
 * Body shape expected by POST /api/v1/appointments:
 *   - petId: positive integer (required)
 *   - scheduledAt: ISO 8601 string (required)
 *   - notes: optional, max 500 chars
 *
 * clientId is derived from the pet entity, not included in the request.
 */
export interface CreateAppointmentDto {
  /** The pet to schedule — required, positive integer */
  petId: number;
  /** Appointment date/time in UTC — required, ISO 8601 string */
  scheduledAt: string;
  /** Optional notes — max 500 characters */
  notes?: string;
}
