import { Service } from '../domain/Service';
import { IServiceRepository } from '../domain/IServiceRepository';
import { NotFoundError } from '@api/shared/domain/errors';

export class GetServiceUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(id: number): Promise<Service> {
    const service = await this.repository.findById(id);

    if (!service || service.deletedAt !== null) {
      throw new NotFoundError('Service', id);
    }

    return service;
  }
}
