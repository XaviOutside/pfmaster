/**
 * Domain errors for the appointments bounded context.
 * These extend shared domain errors for consistent error mapping
 * across all bounded contexts.
 *
 * Controller error mapping:
 *   AppointmentNotFoundError   → 404 (extends NotFoundError)
 *   AppointmentValidationError → 422 (extends ValidationError)
 *   AppointmentConflictError   → 409 (extends ConflictError)
 */
import { NotFoundError, ValidationError, ConflictError } from '@api/shared/domain/errors';

export class AppointmentNotFoundError extends NotFoundError {
  constructor(id: number) {
    super('Appointment', id);
    this.name = 'AppointmentNotFoundError';
  }
}

export class AppointmentValidationError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'AppointmentValidationError';
  }
}

export class AppointmentConflictError extends ConflictError {
  constructor(detail: string) {
    super('Appointment', detail);
    this.name = 'AppointmentConflictError';
  }
}
