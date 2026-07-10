# Client Management Frontend Specification

## Purpose

Responsive web UI for managing pet grooming clients — list, search, create, view, edit, deactivate, and reactivate via the `/api/v1/clients/` backend.

## Requirements

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

### Requirement: Client Detail View

The page at `/clients/:id` MUST show all client fields and action buttons (edit, deactivate, reactivate). It MUST show a 404 message when the client is not found.

#### Scenario: Happy path — viewing a client

- GIVEN a client exists with id 42
- WHEN the user navigates to `/clients/42`
- THEN all client fields are displayed with edit and deactivate action buttons

#### Scenario: Client not found (404)

- GIVEN no client exists with id 999
- WHEN the user navigates to `/clients/999`
- THEN a "Client not found" message is displayed with a link back to the client list

### Requirement: Create Client Form

The page at `/clients/new` MUST validate required fields (name, email, phone) on blur and on submit. On success it MUST redirect to the detail page. On server validation errors (422) it MUST show inline field errors. Server errors (500) MUST show a generic error message.

#### Scenario: Happy path — successful creation

- GIVEN the user fills all required fields validly
- WHEN the form is submitted
- THEN the client is created and the browser redirects to `/clients/{newId}`

#### Scenario: Server validation failure (422)

- GIVEN the user submits data with a duplicate email
- WHEN the API returns a 422 with field errors
- THEN inline error messages appear under the relevant form fields

### Requirement: Edit Client Form

The page at `/clients/:id/edit` MUST pre-populate all fields from existing client data and validate input on submission.

#### Scenario: Happy path — successful edit

- GIVEN the user navigates to `/clients/42/edit`
- WHEN the form is pre-populated with client 42's data, the user modifies a field, and submits
- THEN the client is updated and the browser redirects to `/clients/42`

### Requirement: Deactivate / Reactivate

The system MUST show a confirmation modal for deactivate and reactivate actions. After confirmation, the UI MUST update to reflect the new status.

#### Scenario: Confirm and deactivate

- GIVEN viewing an active client on the detail page
- WHEN the user clicks "Deactivate" and confirms in the modal
- THEN the client status changes to inactive and the UI reflects the new state

### Requirement: Client Search

The search box on the list page MUST trigger a search request after a 300ms debounce and also on explicit button click. Results SHALL replace the table content. Zero results SHALL show an empty state.

#### Scenario: Auto-search finds results

- GIVEN the user types a search query in the list page search box
- WHEN 300ms elapses after the last keystroke
- THEN the table updates with matching results from `/api/v1/clients/search?q=...`

#### Scenario: Explicit search button click

- GIVEN the user has typed a query
- WHEN the user clicks the search button
- THEN results update immediately regardless of debounce timer

### Requirement: Loading Indicators

The system MUST show loading indicators during all API calls — list, detail, create, edit, search, deactivate, and reactivate.

#### Scenario: List loading state

- GIVEN the user navigates to `/clients`
- WHEN the API request is in flight
- THEN a skeleton or spinner is displayed instead of the table

### Requirement: Responsive Layout

The system MUST render correctly on desktop (1920px) and tablet (768px) viewports. Tables SHALL adapt to card-based layout on narrower viewports.

#### Scenario: Tablet list view

- GIVEN the viewport is 768px wide
- WHEN the user views the client list
- THEN the table layout adapts to a stacked card format

### Requirement: Embedded Pet List in Client Detail

The page at `/clients/:id` MUST display an embedded table listing all non-deleted pets belonging to that client below the client detail card. Each row SHALL show pet name, species, breed, and status badge. The section MUST support loading, empty ("No pets yet"), and error states.

#### Scenario: Client has pets

- GIVEN client id=42 has 2 active pets
- WHEN navigating to `/clients/42`
- THEN a "Pets" section below the client detail card shows a table with name, species, breed, and status badge for each pet

#### Scenario: Client has no pets

- GIVEN client id=42 has no pets
- WHEN navigating to `/clients/42`
- THEN the Pets section shows "No pets yet" with a link to `/pets/new?client_id=42`

#### Scenario: Pet list loading state

- GIVEN the client detail page is loading pet data
- WHEN the API request is in flight
- THEN the Pets section shows a skeleton or spinner

#### Scenario: Pet list error state

- GIVEN the `/api/v1/pets` endpoint returns an error for the client's pets
- WHEN the Pets section fails to load
- THEN an error message is displayed within the section

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
