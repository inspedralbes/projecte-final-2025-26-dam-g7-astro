## MODIFIED Requirements

### Requirement: Friends search shows maximum 9 explorers
The "Buscar amigos" tab SHALL display a maximum of 9 random explorers at a time (not the current 12).

#### Scenario: Explorer list is limited to 9
- **WHEN** the user navigates to the search tab or clicks the refresh button
- **THEN** at most 9 explorers are shown in the grid
- **THEN** the grid layout (cols 12/md-6/lg-4) fits 9 cards cleanly in 3 rows of 3 at large screens
