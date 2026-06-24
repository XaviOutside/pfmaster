# client-search Specification

## Purpose

Defines requirements for full-text search over client records using MySQL FTS. Covers the `sanitizeFtsQuery` utility, the `SearchClients` use case, the repository method, and the REST endpoint. Input sanitization is the primary security concern.

## Out of Scope

- Searching pets, services, or appointments — separate bounded contexts
- Frontend search UI — separate change
- Fuzzy/phonetic matching — not supported in this change
- Pagination of search results — results are returned as a flat array (max 50)

---

## Requirements

### Requirement: sanitizeFtsQuery Utility

`api/shared/utils/sanitizeFtsQuery.ts` MUST export a function `sanitizeFtsQuery(term: string): string` that strips all MySQL FTS operator characters (`+`, `-`, `*`, `"`, `(`, `)`) from the input string, trims leading/trailing whitespace, and returns the sanitized result. If the result is an empty string after sanitization, the function MUST return an empty string (callers are responsible for handling the empty case). The function MUST be pure — no side effects, no I/O.

#### Scenario: FTS operators are stripped

- GIVEN input `'+(cat) -dog* "poodle"'`
- WHEN `sanitizeFtsQuery(input)` is called
- THEN the return value is `'cat dog poodle'`

#### Scenario: Normal search term is unchanged (except trim)

- GIVEN input `'  Ana López  '`
- WHEN `sanitizeFtsQuery(input)` is called
- THEN the return value is `'Ana López'`

#### Scenario: Input of only operators returns empty string

- GIVEN input `'+-*"()'`
- WHEN `sanitizeFtsQuery(input)` is called
- THEN the return value is `''`

#### Scenario: Empty string input returns empty string

- GIVEN input `''`
- WHEN `sanitizeFtsQuery(input)` is called
- THEN the return value is `''`

#### Scenario: Each operator character is stripped individually

- GIVEN six inputs, each containing exactly one operator: `+`, `-`, `*`, `"`, `(`, `)`
- WHEN `sanitizeFtsQuery` is called on each
- THEN none of the returned strings contain the operator character

---

### Requirement: SearchClients Use Case

`api/clients/application/SearchClients.ts` MUST accept a `query` string parameter. It MUST call `sanitizeFtsQuery(query)` before passing the result to `IClientRepository.search(sanitizedQuery)`. If the sanitized query is empty, it MUST return an empty array immediately without calling the repository. It MUST return an array of active (non-soft-deleted) Client entities. Results are capped at 50 entries.

#### Scenario: Valid query returns matching clients

- GIVEN repository mock returns two Client entities for the sanitized term `'ana'`
- WHEN `SearchClientsUseCase.execute({ query: 'ana' })` is called
- THEN the repository's `search` method is called with `'ana'`
- AND two Client entities are returned

#### Scenario: Empty query returns empty array without calling repository

- GIVEN query is `''`
- WHEN `SearchClientsUseCase.execute({ query: '' })` is called
- THEN repository `search` is NOT called
- AND an empty array `[]` is returned

#### Scenario: Query with only operators returns empty array

- GIVEN query is `'+-*'`
- WHEN `SearchClientsUseCase.execute({ query: '+-*' })`
- THEN `sanitizeFtsQuery` strips all chars, leaving `''`
- AND repository `search` is NOT called
- AND `[]` is returned

#### Scenario: Query is sanitized before reaching repository

- GIVEN query is `'"poodle"'`
- WHEN `SearchClientsUseCase.execute({ query: '"poodle"' })`
- THEN repository `search` is called with `'poodle'` (quotes stripped)
- AND NOT called with the raw `'"poodle"'` string

---

### Requirement: IClientRepository Search Method

`IClientRepository` MUST declare a `search(sanitizedQuery: string): Promise<Client[]>` method. `PrismaClientRepository` MUST implement it using `MATCH(name, email) AGAINST(? IN BOOLEAN MODE)` via Prisma's `$queryRaw` with parameterized binding. The query MUST filter `deleted_at IS NULL`. Results are limited to 50 rows.

#### Scenario: FTS query uses parameterized binding

- GIVEN a sanitized term `'maria'`
- WHEN `PrismaClientRepository.search('maria')` is called
- THEN the underlying SQL uses a parameter placeholder (`?`) for the term
- AND the term is NOT interpolated directly into the query string

#### Scenario: Soft-deleted clients excluded from search results

- GIVEN the database contains one active client named "Maria" and one soft-deleted client named "Maria"
- WHEN `PrismaClientRepository.search('maria')` is called
- THEN only the active client is returned

#### Scenario: Result set is capped at 50

- GIVEN 60 active clients match the search term
- WHEN `PrismaClientRepository.search(term)` is called
- THEN at most 50 clients are returned

---

### Requirement: Search REST Endpoint

The `ClientController` MUST handle `GET /api/v1/clients/search?q=term`. The `q` query parameter is required; if absent or empty after trimming, the response MUST be HTTP 400. The route handler MUST call `SearchClientsUseCase.execute({ query: q })` and return HTTP 200 with an array of `ClientResponseDto` objects (empty array `[]` is a valid 200 response).

#### Scenario: Search returns matching clients as array

- GIVEN two clients exist matching the name "Ana"
- WHEN `GET /api/v1/clients/search?q=Ana` is requested
- THEN response status is 200
- AND body is an array of two `ClientResponseDto` objects

#### Scenario: No matches returns 200 with empty array

- GIVEN no clients match the query "xyznotfound"
- WHEN `GET /api/v1/clients/search?q=xyznotfound` is requested
- THEN response status is 200
- AND body is `[]`

#### Scenario: Missing q parameter returns 400

- GIVEN the request URL is `GET /api/v1/clients/search` (no `q` param)
- WHEN the request is processed
- THEN response status is 400
- AND body contains `{ "error": "Query parameter 'q' is required" }`

#### Scenario: FTS operator characters in q do not cause SQL error

- GIVEN query parameter `q = '+(poodle)'`
- WHEN `GET /api/v1/clients/search?q=%2B%28poodle%29` is requested
- THEN response status is 200 (sanitizer strips operators before FTS)
- AND no 500 error is returned

---

### Requirement: Security — FTS Injection Prevention

- `sanitizeFtsQuery()` MUST be the ONLY gate between user input and the FTS `AGAINST()` expression.
- The route handler MUST NOT pass the raw `q` value directly to any repository method or SQL string.
- `sanitizeFtsQuery` unit tests MUST cover all six operator characters individually AND in combination.
- The repository MUST use Prisma `$queryRaw` with tagged template literals or parameterized binding — never string concatenation.

#### Scenario: Injection attempt via q param is neutralized

- GIVEN query `q = '"+*(DROP TABLE clients)+"'`
- WHEN `sanitizeFtsQuery` processes the input
- THEN the returned string contains no `+`, `-`, `*`, `"`, `(`, or `)` characters
- AND the repository receives a plain keyword string, not a malformed FTS expression
