# Delta for client-management-frontend

## ADDED Requirements

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
