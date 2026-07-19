import { Pet } from '../domain/Pet';
import { IPetRepository } from '../domain/IPetRepository';
import { sanitizeFtsQuery } from '@api/shared/utils/sanitizeFtsQuery';

export interface SearchPetsParams {
  query: string;
}

export class SearchPetsUseCase {
  constructor(private readonly repository: IPetRepository) {}

  async execute(params: SearchPetsParams): Promise<Pet[]> {
    const { query, isEmpty } = sanitizeFtsQuery(params.query);

    if (isEmpty) {
      return [];
    }

    return this.repository.search(query);
  }
}
