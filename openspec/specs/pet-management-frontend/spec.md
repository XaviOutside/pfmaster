# Pet Management Frontend Specification

## Purpose

Responsive web UI for managing pets — list/search/create/view/edit/deactivate/delete via `/api/v1/pets` backend, plus an embedded pet list inside Client Detail.

## Requirements

### Requirement: Pet List Page (FR-9)

`/pets` MUST display a paginated table of pets showing name, species, breed, and status. It MUST show loading/empty/error states and a search bar with 300ms debounce.

#### Scenario: List loads

- GIVEN active pets exist
- WHEN navigating to `/pets`
- THEN paginated table displays name, species, breed, status badges

#### Scenario: Empty state

- GIVEN no pets exist
- WHEN navigating to `/pets`
- THEN a user-friendly empty state message is shown with a create call-to-action

### Requirement: Pet Detail Page (FR-10)

`/pets/:id` MUST show all pet fields, owner client link, and action buttons (edit, deactivate, delete with confirmation). 404 message when not found.

#### Scenario: View pet

- GIVEN pet id=7 exists
- WHEN navigating to `/pets/7`
- THEN all fields displayed; edit/deactivate/delete actions visible; owner name links to `/clients/{clientId}`

#### Scenario: Pet not found

- GIVEN no pet with id=999
- WHEN navigating to `/pets/999`
- THEN "Pet not found" message with link back to `/pets`

### Requirement: Pet Create Form (FR-11)

`/pets/new` MUST validate required fields (name, species, client_id) on blur and submit. Client selector dropdown lists active clients. On success redirect to detail page. On 422 show inline errors.

#### Scenario: Successful creation

- GIVEN user fills name="Rex", species="Dog", selects an active client
- WHEN form is submitted
- THEN pet is created, browser redirects to `/pets/{newId}`

#### Scenario: Client selector only lists active clients

- GIVEN 3 active and 2 inactive clients
- WHEN user opens the client selector on `/pets/new`
- THEN only 3 active clients appear in the dropdown

### Requirement: Pet Edit Form (FR-12)

`/pets/:id/edit` MUST pre-populate all fields from existing pet data. Validates on submission.

#### Scenario: Edit and save

- GIVEN navigating to `/pets/7/edit` with pet "Rex"
- WHEN user changes name to "Max" and submits
- THEN pet is updated and browser redirects to `/pets/7`

### Requirement: Delete/Deactivate with Confirmation (FR-13)

The detail page MUST show a confirmation modal before deactivate or delete. After confirmation, UI MUST update to reflect new state.

#### Scenario: Confirm deactivate

- GIVEN viewing active pet on detail page
- WHEN user clicks "Deactivate" and confirms in modal
- THEN pet status changes to inactive; UI reflects the change

### Requirement: Embedded Pet List in Client Detail (FR-14)

`/clients/:id` MUST show an embedded table listing all active pets belonging to that client below the client detail card.

#### Scenario: Client has pets

- GIVEN client id=42 has 2 active pets
- WHEN navigating to `/clients/42`
- THEN a "Pets" section shows both pets in a table with name, species, breed, status

#### Scenario: Client has no pets

- GIVEN client id=42 has no pets
- WHEN navigating to `/clients/42`
- THEN the Pets section shows "No pets yet" with a link to `/pets/new?client_id=42`

### Requirement: Loading, Empty, and Error States

All pages MUST show skeleton/spinner during API calls, empty states when data is absent, and error messages on failure.

#### Scenario: Loading

- GIVEN navigating to `/pets`
- WHEN the API request is in flight
- THEN skeleton or spinner displays instead of the table

#### Scenario: API error

- GIVEN the `/api/v1/pets` endpoint returns 500
- WHEN navigating to `/pets`
- THEN an error message with retry button is displayed
