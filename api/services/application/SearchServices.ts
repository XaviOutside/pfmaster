import { Service } from '../domain/Service';
import { IServiceRepository } from '../domain/IServiceRepository';
import { sanitizeFtsQuery } from '@api/shared/utils/sanitizeFtsQuery';

export interface SearchServicesParams {
  query: string;
}

export class SearchServicesUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(params: SearchServicesParams): Promise<Service[]> {
    const { query, isEmpty } = sanitizeFtsQuery(params.query);

    if (isEmpty) {
      return [];
    }

    return this.repository.search(query);
  }
}
