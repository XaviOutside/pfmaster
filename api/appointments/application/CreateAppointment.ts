import { Appointment, CreateAppointmentInput, MAX_NOTES_LENGTH } from '../domain/Appointment';
import { IAppointmentRepository } from '../domain/IAppointmentRepository';
import { IPetRepository } from '../../pets/domain/IPetRepository';
import {
  AppointmentNotFoundError,
  AppointmentValidationError,
  AppointmentConflictError,
} from '../domain/AppointmentErrors';

/**
 * Creates a new appointment for a pet.
 *
 * Business rules:
 * - Pet MUST exist (404 if not found).
 * - Same pet CANNOT be double-booked at the same scheduled_at (409 Conflict).
 * - Notes SHALL NOT exceed 500 characters (422).
 * - Status defaults to PENDING (0).
 * - client_id is denormalized from the pet entity on create.
 */
export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly petRepo: IPetRepository,
  ) {}

  async execute(input: {
    petId: number;
    scheduledAt: Date;
    notes?: string | null;
  }): Promise<Appointment> {
    // 1. Verify pet exists
    const pet = await this.petRepo.findById(input.petId);
    if (!pet) {
      throw new AppointmentNotFoundError(input.petId);
    }

    // 2. Check double-booking
    const hasConflict = await this.appointmentRepo.existsByPetAndTime(
      input.petId,
      input.scheduledAt,
    );
    if (hasConflict) {
      throw new AppointmentConflictError(
        `Pet ${input.petId} already has an appointment at ${input.scheduledAt.toISOString()}`,
      );
    }

    // 3. Validate notes length
    if (input.notes != null && input.notes.length > MAX_NOTES_LENGTH) {
      throw new AppointmentValidationError(
        `notes must not exceed ${MAX_NOTES_LENGTH} characters`,
      );
    }

    // 4. Create the appointment (clientId denormalized from pet)
    const createInput: CreateAppointmentInput = {
      petId: input.petId,
      clientId: pet.client_id,
      scheduledAt: input.scheduledAt,
      notes: input.notes ?? null,
    };

    return this.appointmentRepo.create(createInput);
  }
}
