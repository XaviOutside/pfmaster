import { IPetRepository } from '../domain/IPetRepository';
import { IServiceRepository } from '../../services/domain/IServiceRepository';
import { PetNotFoundError, PetAlreadyDeletedError } from '../domain/PetErrors';

export class SoftDeletePetUseCase {
  constructor(
    private readonly repository: IPetRepository,
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const exists = await this.repository.existsById(id);

    if (!exists) {
      throw new PetNotFoundError(id);
    }

    const pet = await this.repository.findById(id);

    if (!pet) {
      throw new PetAlreadyDeletedError(id);
    }

    // Cascade: unlink all services linked to this pet before soft-deleting
    await this.serviceRepository.unlinkAllByPetId(id);

    await this.repository.softDelete(id);
  }
}
