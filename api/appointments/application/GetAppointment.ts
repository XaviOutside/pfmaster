import { Appointment } from '../domain/Appointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import { AppointmentNotFoundError } from '../domain/AppointmentErrors';

/**
 * Retrieves a single appointment by its ID.
 * Throws AppointmentNotFoundError if not found.
 */
export class GetAppointmentUseCase {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(id: number): Promise<Appointment> {
    const appointment = await this.repository.findById(id);

    if (!appointment) {
      throw new AppointmentNotFoundError(id);
    }

    return appointment;
  }
}
