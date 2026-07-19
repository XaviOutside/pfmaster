/**
 * Request DTO for updating an existing appointment.
 * All fields are optional — only provided fields are changed.
 *
 * status values (TINYINT):
 *   0 = pending, 1 = confirmed, 2 = completed, 3 = cancelled.
 *
 * Completed appointments (status=2) cannot be modified.
 */
export interface UpdateAppointmentDto {
  /** New scheduled date/time — optional, ISO 8601 string */
  scheduledAt?: string;
  /** Updated notes — optional, max 500 chars, null to clear */
  notes?: string | null;
  /** Status transition — optional. 0=pending, 1=confirmed, 3=cancelled */
  status?: number;
}
