# client-management Specification

## Purpose

Defines requirements for the Clients bounded context: the domain model, all five CRUD use cases, the repository contract, the Prisma-backed infrastructure, and the REST interface layer. This is a greenfield full spec — no existing spec to delta against.

## Out of Scope

- client-search capability — specified separately
- Frontend rendering of client data — separate change
- Authentication/authorization — deferred
- Pets, Services, Appointments — separate bounded contexts

---

## Requirements

### Requirement: Client Domain Entity

The `Client` entity MUST be defined in `api/clients/domain/Client.ts` with fields: `id` (number), `name` (string), `email` (string), `phone` (string), `phone2` (string | null), `address` (string | null), `status` (ClientStatus), `createdAt` (Date), `updatedAt` (Date), `deletedAt` (Date | null). `ClientStatus` MUST be a TypeScript union type `0 | 1` (0 = inactive, 1 = active). The domain layer MUST NOT import from Express, Prisma, or any framework package.

#### Scenario: Client entity created with valid data

- GIVEN valid constructor arguments for all required fields
- WHEN a `Client` instance is created
- THEN all fields are accessible and `deletedAt` defaults to `null`

#### Scenario: Domain layer has no framework imports

- GIVEN all files in `api/clients/domain/`
- WHEN statically analyzed for import statements
- THEN no imports reference `express`, `@prisma/client`, `pino`, or any non-domain module outside `api/shared/domain/`

---

### Requirement: IClientRepository Interface

`api/clients/domain/IClientRepository.ts` MUST declare an interface with methods: `create(data)`, `findById(id)`, `findAll(page, limit)`, `update(id, data)`, `softDelete(id)`. The interface MUST reference only domain types — no Prisma types allowed. All use cases MUST depend on this interface, never on a concrete implementation.

#### Scenario: Use case depends only on interface

- GIVEN `CreateClientUseCase` in `api/clients/application/`
- WHEN its constructor signature is inspected
- THEN the repository parameter type is `IClientRepository`, not `PrismaClientRepository`

---

### Requirement: CreateClient Use Case

`api/clients/application/CreateClient.ts` MUST accept a `CreateClientDto` (name, email, phone, phone2?, address?), validate required fields, set `status = 1` (active) by default, and persist via `IClientRepository.create()`. It MUST return the created `Client` entity. Duplicate email detection is NOT required in this change (deferred).

#### Scenario: Client created with required fields

- GIVEN a repository mock that resolves with a `Client` entity
- AND `CreateClientDto` with `name`, `email`, `phone`
- WHEN `CreateClientUseCase.execute(dto)` is called
- THEN `repository.create` is called once with status `1`
- AND the returned entity matches the mock response

#### Scenario: Missing required field throws validation error

- GIVEN `CreateClientDto` where `name` is an empty string
- WHEN `CreateClientUseCase.execute(dto)` is called
- THEN it throws a `ClientValidationError` (or equivalent domain error)
- AND `repository.create` is NOT called

#### Scenario: Default status is active

- GIVEN a valid `CreateClientDto` with no explicit status field
- WHEN `CreateClientUseCase.execute(dto)` is called
- THEN `repository.create` is called with `status: 1`

---

### Requirement: GetClient Use Case

`api/clients/application/GetClient.ts` MUST accept a numeric `id`, call `IClientRepository.findById(id)`, and return the entity. If the record does not exist OR `deletedAt` is non-null, it MUST throw a `ClientNotFoundError`.

#### Scenario: Existing active client is returned

- GIVEN repository mock returns a Client with `deletedAt: null`
- WHEN `GetClientUseCase.execute(id)` is called
- THEN the Client entity is returned

#### Scenario: Non-existent client throws not-found error

- GIVEN repository mock returns `null`
- WHEN `GetClientUseCase.execute(id)` is called
- THEN a `ClientNotFoundError` is thrown

#### Scenario: Soft-deleted client throws not-found error

- GIVEN repository mock returns a Client where `deletedAt` is a valid Date
- WHEN `GetClientUseCase.execute(id)` is called
- THEN a `ClientNotFoundError` is thrown

---

### Requirement: ListClients Use Case

`api/clients/application/ListClients.ts` MUST accept `page` (integer ≥ 1) and `limit` (integer 1–100) parameters, call `IClientRepository.findAll(page, limit)`, and return an array of active Client entities (excludes soft-deleted records). Default `page` is 1; default `limit` is 20.

#### Scenario: Returns paginated active clients

- GIVEN repository mock returns two active Client entities
- WHEN `ListClientsUseCase.execute({ page: 1, limit: 20 })`
- THEN an array of two Clients is returned
- AND no soft-deleted clients appear in the result

#### Scenario: Invalid page parameter is rejected

- GIVEN `page` is 0
- WHEN `ListClientsUseCase.execute({ page: 0, limit: 20 })`
- THEN a `ClientValidationError` is thrown

#### Scenario: Limit clamped to 100

- GIVEN `limit` is 200
- WHEN `ListClientsUseCase.execute({ page: 1, limit: 200 })`
- THEN a `ClientValidationError` is thrown

---

### Requirement: UpdateClient Use Case

`api/clients/application/UpdateClient.ts` MUST accept an `id` and `UpdateClientDto` (all fields optional: name, email, phone, phone2, address, status). It MUST verify the client exists and is not soft-deleted before updating, then call `IClientRepository.update(id, data)`. It MUST return the updated `Client` entity.

#### Scenario: Client fields updated successfully

- GIVEN a repository mock that resolves the existing client then the updated client
- WHEN `UpdateClientUseCase.execute(id, { name: 'New Name' })`
- THEN `repository.update` is called with the correct id and partial data
- AND the updated entity is returned

#### Scenario: Update on non-existent client throws not-found error

- GIVEN repository mock returns `null` for `findById`
- WHEN `UpdateClientUseCase.execute(id, dto)`
- THEN a `ClientNotFoundError` is thrown
- AND `repository.update` is NOT called

#### Scenario: Update on soft-deleted client throws not-found error

- GIVEN repository mock returns a Client where `deletedAt` is a valid Date
- WHEN `UpdateClientUseCase.execute(id, dto)`
- THEN a `ClientNotFoundError` is thrown

---

### Requirement: SoftDeleteClient Use Case

`api/clients/application/SoftDeleteClient.ts` MUST accept an `id`, verify the client exists and is not already soft-deleted, then call `IClientRepository.softDelete(id)` which sets `deletedAt` to the current UTC timestamp. It MUST NOT physically delete the database row. It MUST return `void`.

#### Scenario: Active client is soft-deleted

- GIVEN a repository mock that resolves an active Client for `findById`
- WHEN `SoftDeleteClientUseCase.execute(id)` is called
- THEN `repository.softDelete(id)` is called once
- AND the database row is NOT deleted (only `deletedAt` is set)

#### Scenario: Already soft-deleted client throws not-found error

- GIVEN repository mock returns a Client with `deletedAt` set
- WHEN `SoftDeleteClientUseCase.execute(id)` is called
- THEN a `ClientNotFoundError` is thrown
- AND `repository.softDelete` is NOT called

#### Scenario: Subsequent GetClient after soft-delete returns not-found

- GIVEN a client was soft-deleted
- WHEN `GetClientUseCase.execute(id)` is called for the same id
- THEN a `ClientNotFoundError` is thrown

---

### Requirement: PrismaClientRepository

`api/clients/infrastructure/PrismaClientRepository.ts` MUST implement `IClientRepository` using the shared Prisma singleton. All queries MUST include a `deletedAt: null` filter for read operations (`findById`, `findAll`). `softDelete` MUST call `prisma.client.update({ where: { id }, data: { deletedAt: new Date() } })`. The Prisma client MUST NOT be imported in any layer except `infrastructure/`.

#### Scenario: findAll excludes soft-deleted records

- GIVEN the database contains 3 clients: 2 active, 1 soft-deleted
- WHEN `PrismaClientRepository.findAll(1, 20)` is called
- THEN only 2 active clients are returned

#### Scenario: softDelete sets deletedAt without deleting row

- GIVEN a client with `id = 1` exists in the database
- WHEN `PrismaClientRepository.softDelete(1)` is called
- THEN the row in `clients` has `deleted_at` set to a non-null timestamp
- AND `SELECT COUNT(*) FROM clients WHERE id = 1` still returns 1

---

### Requirement: Clients REST Interface

The `ClientController` MUST expose five HTTP endpoints mounted at `/api/v1/clients`:

| Method | Path | Use Case | Success Status |
|--------|------|----------|---------------|
| POST | `/api/v1/clients` | CreateClient | 201 |
| GET | `/api/v1/clients` | ListClients | 200 |
| GET | `/api/v1/clients/:id` | GetClient | 200 |
| PUT | `/api/v1/clients/:id` | UpdateClient | 200 |
| DELETE | `/api/v1/clients/:id` | SoftDeleteClient | 204 |

All responses MUST use `ClientResponseDto` — no Prisma model types leaked to HTTP responses. `ClientNotFoundError` MUST map to HTTP 404. `ClientValidationError` MUST map to HTTP 422. Unexpected errors MUST map to HTTP 500 and MUST NOT expose internal stack traces.

#### Scenario: POST /clients creates and returns 201

- GIVEN valid JSON body `{ "name": "Ana López", "email": "ana@example.com", "phone": "555-0001" }`
- WHEN `POST /api/v1/clients` is requested
- THEN response status is 201
- AND body contains `id`, `name`, `email`, `status: 1`

#### Scenario: GET /clients/:id returns 404 for soft-deleted client

- GIVEN a client with `id = 5` has `deleted_at` set
- WHEN `GET /api/v1/clients/5` is requested
- THEN response status is 404
- AND body contains `{ "error": "Client not found" }` (no stack trace)

#### Scenario: DELETE /clients/:id returns 204

- GIVEN a client with `id = 3` is active
- WHEN `DELETE /api/v1/clients/3` is requested
- THEN response status is 204 with empty body

#### Scenario: POST /clients with missing name returns 422

- GIVEN JSON body `{ "email": "x@example.com", "phone": "555-0000" }` (no name)
- WHEN `POST /api/v1/clients` is requested
- THEN response status is 422
- AND body contains a descriptive validation error message

#### Scenario: Internal error never exposes stack trace

- GIVEN the repository throws an unexpected runtime error
- WHEN any `/api/v1/clients` endpoint is called
- THEN response status is 500
- AND body does NOT contain a stack trace or internal file path

---

### Requirement: Prisma Schema and Migration

`prisma/schema.prisma` MUST define a `Client` model with fields matching the domain entity, using `@@fulltext(["name", "email"])` and `previewFeatures = ["fullTextSearch", "fullTextIndex"]`. A Prisma migration MUST generate a `clients` table with: `status TINYINT` (default 1), `deleted_at DATETIME NULL`, and a `FULLTEXT(name, email)` index. No `FOREIGN KEY` constraints are permitted.

#### Scenario: Migration creates clients table with correct schema

- GIVEN `npx prisma migrate dev` runs successfully
- WHEN `DESCRIBE clients` is executed in MySQL
- THEN columns include `status` (TINYINT), `deleted_at` (DATETIME, nullable), `name` (VARCHAR), `email` (VARCHAR)

#### Scenario: No foreign key constraints exist on clients table

- GIVEN the migration has been applied
- WHEN `SHOW CREATE TABLE clients` is executed
- THEN the output contains zero `FOREIGN KEY` definitions

---

### Requirement: Security — OWASP Compliance

- **(Injection)** All DB queries MUST use Prisma parameterized operations — no string interpolation into queries.
- **(Broken Access Control)** All `:id` parameters MUST be validated as positive integers before use; non-numeric IDs MUST return 422.
- **(Security Misconfiguration)** `NODE_ENV` MUST be read from env; stack traces MUST be suppressed when `NODE_ENV = 'production'`.
- **(Security Logging)** All 4xx and 5xx responses MUST be logged with the pino logger, including request method, path, and status code — never logging request body content that may contain PII.

#### Scenario: Non-numeric id is rejected before reaching use case

- GIVEN `GET /api/v1/clients/abc`
- WHEN the request is processed
- THEN response status is 422
- AND the use case is NOT called

#### Scenario: PII is not logged in request body

- GIVEN a request with a body containing `email` and `phone`
- WHEN the request is processed and logs are inspected
- THEN no log line contains the raw `email` or `phone` value from the request body
