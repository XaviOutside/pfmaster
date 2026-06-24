import { Client } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';
import { sanitizeFtsQuery } from '@api/shared/utils/sanitizeFtsQuery';

export interface SearchClientsParams {
  query: string;
}

export class SearchClientsUseCase {
  constructor(private readonly repository: IClientRepository) {}

  async execute(params: SearchClientsParams): Promise<Client[]> {
    const sanitized = sanitizeFtsQuery(params.query);

    if (!sanitized) {
      return [];
    }

    return this.repository.search(sanitized);
  }
}
