import { Appointment } from '../domain/Appointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import { AppointmentValidationError } from '../domain/AppointmentErrors';

/**
 * Lists appointments within a date range, ordered ascending by scheduled_at.
 * Requires start < end; throws ValidationError otherwise.
 */
export class ListAppointmentsUseCase {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(start: Date, end: Date): Promise<Appointment[]> {
    if (start >= end) {
      throw new AppointmentValidationError('start must be before end');
    }

    return this.repository.findByDateRange(start, end);
  }
}
