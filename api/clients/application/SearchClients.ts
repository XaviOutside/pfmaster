import { Client } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';
import { sanitizeFtsQuery } from '@api/shared/utils/sanitizeFtsQuery';
import { saneValidateQuery } from '@api/shared/utils/sane';

export interface SearchClientsParams {
  query: string;
}

export class SearchClientsUseCase {
  constructor(private readonly repository: IClientRepository) {}

  async execute(params: SearchClientsParams): Promise<Client[]> {
    const trimmed = params.query.trim();

    // 3-char gate: queries shorter than 3 characters return empty (no DB call)
    if (trimmed.length < 3) {
      return [];
    }

    // Sanitize: strip stopwords, normalize whitespace, lowercase
    const { query, isEmpty } = sanitizeFtsQuery(trimmed);

    // All-stopword gate: if sanitization removes everything, return empty
    if (isEmpty) {
      return [];
    }

    // SANE invariant check: reject FTS operators and <3 char non-empty queries
    saneValidateQuery(query);

    return this.repository.search(query);
  }
}
