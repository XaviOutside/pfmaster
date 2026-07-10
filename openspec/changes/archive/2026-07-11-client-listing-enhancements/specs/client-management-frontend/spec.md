# Delta for client-management-frontend

## MODIFIED Requirements

### Requirement: Client List View

The page at `/clients` MUST display a paginated table of clients in four columns: client name with numeric ID, contact details (email, phone, phone2, address), status, and last service date. It MUST show an empty state when no clients exist and SHOW a loading indicator during API calls.
(Previously: three columns showing name, email, phone, and status)

#### Scenario: Happy path — list loads with clients

- GIVEN the API returns active clients with optional phone2, address, and lastServiceDate fields
- WHEN the user navigates to `/clients`
- THEN four columns display: | Client | Contact | Status | Last Service |
- AND the Client column shows bold name with muted numeric ID below
- AND the Contact column shows email, phone, plus phone2 and address when present
- AND the Last Service column shows DD/MM/YYYY or "—" when null

#### Scenario: Nullable fields — missing data renders gracefully

- GIVEN a client has null phone2, null address, and null lastServiceDate
- WHEN the user views the client list
- THEN phone2 and address rows are omitted from the Contact column
- AND last service date displays "—"

#### Scenario: Empty state — no clients exist

- GIVEN no clients exist in the system
- WHEN the user navigates to `/clients`
- THEN a user-friendly empty state message is shown with a call-to-action

#### Scenario: Mobile viewport — stacked card layout

- GIVEN the viewport is 768px wide or narrower
- WHEN the user views the client list
- THEN the four-column desktop table adapts to a stacked card format preserving all field information

## ADDED Requirements

### Requirement: Client Name Column with ID and Avatar

The client name column MUST render the name in bold weight. A muted numeric ID prefixed with "#" MUST appear directly below the name. The avatar and text block MUST have at least `gap-4` (16px) horizontal separation.

#### Scenario: Renders bold name with muted ID

- GIVEN a client with id=42 and name="María García"
- WHEN the client row renders
- THEN "María García" appears in bold
- AND "#42" appears below the name in muted/less prominent style
- AND the avatar is separated from the text block by at least 16px

### Requirement: Expanded Contact Details

The contact column MUST display phone2 and address below the existing email and phone fields when those values are non-null. When null, the corresponding rows MUST NOT render.

#### Scenario: Client with all contact fields

- GIVEN a client with phone="555-1001", phone2="555-1002", and address="Calle Mayor 12"
- WHEN the client row renders
- THEN the contact column shows email, phone, phone2, and address as stacked rows
- AND each row includes a material icon matching its field type

#### Scenario: Client without phone2 or address

- GIVEN a client with phone2=null and address=null
- WHEN the client row renders
- THEN the contact column shows only email and phone
- AND no empty rows or placeholder text appear for missing fields

### Requirement: Last Service Date Column

The client list MUST include an "Último servicio" column. It SHALL render the `lastServiceDate` as DD/MM/YYYY when the value is non-null, and "—" (em dash) when null. The column SHALL be populated from the `lastServiceDate` field of the API response.

#### Scenario: Client with a last service date

- GIVEN a client with lastServiceDate="2026-06-15T10:00:00.000Z"
- WHEN the client row renders
- THEN the column displays "15/06/2026"

#### Scenario: Client without a last service date

- GIVEN a client with lastServiceDate=null
- WHEN the client row renders
- THEN the column displays "—"

### Requirement: lastServiceDate API Contract

The `ClientResponseDto` MUST include a `lastServiceDate` field of type `string | null`. The value MUST be an ISO 8601 date string when the domain entity has a non-null `lastServiceDate`, or `null` otherwise. The frontend `Client` type MUST mirror this field.

#### Scenario: API returns client list with lastServiceDate

- GIVEN a client has lastServiceDate set in the database
- WHEN `GET /api/v1/clients` returns the client list
- THEN each client object includes `lastServiceDate: "2026-06-15T00:00:00.000Z"` (ISO 8601)

#### Scenario: API returns client without lastServiceDate

- GIVEN a client has null lastServiceDate in the database
- WHEN `GET /api/v1/clients` returns the client list
- THEN the client object includes `lastServiceDate: null`
