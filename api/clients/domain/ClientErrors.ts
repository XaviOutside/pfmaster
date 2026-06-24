/**
 * Domain errors for the clients bounded context.
 * These are pure error classes — no framework or DB imports.
 */

export class ClientNotFoundError extends Error {
  constructor(id: number) {
    super(`Client with id ${id} not found`);
    this.name = 'ClientNotFoundError';
  }
}

export class ClientAlreadyDeletedError extends Error {
  constructor(id: number) {
    super(`Client with id ${id} is already deleted`);
    this.name = 'ClientAlreadyDeletedError';
  }
}

export class ClientValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientValidationError';
  }
}
