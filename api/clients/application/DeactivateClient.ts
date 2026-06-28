import { Client, CLIENT_STATUS } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';
import { ClientNotFoundError } from '../domain/ClientErrors';
import { IPetRepository } from '../../pets/domain/IPetRepository';

export class DeactivateClientUseCase {
  constructor(
    private readonly repository: IClientRepository,
    private readonly petRepository: IPetRepository,
  ) {}

  async execute(id: number): Promise<Client> {
    const client = await this.repository.findById(id);

    if (!client || client.deletedAt !== null) {
      throw new ClientNotFoundError(id);
    }

    const result = await this.repository.update(id, { status: CLIENT_STATUS.INACTIVE });

    await this.petRepository.deactivateAllByClientId(id);

    return result;
  }
}
