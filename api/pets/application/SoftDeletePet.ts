import { IPetRepository } from '../domain/IPetRepository';
import { PetNotFoundError, PetAlreadyDeletedError } from '../domain/PetErrors';

export class SoftDeletePetUseCase {
  constructor(private readonly repository: IPetRepository) {}

  async execute(id: number): Promise<void> {
    const pet = await this.repository.findById(id);

    if (!pet) {
      throw new PetNotFoundError(id);
    }

    if (pet.deletedAt !== null) {
      throw new PetAlreadyDeletedError(id);
    }

    await this.repository.softDelete(id);
  }
}
