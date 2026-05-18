## MODIFIED Requirements

### Requirement: Friend Management Interface
The mobile app SHALL provide an interface for viewing the user's friends list, managing incoming requests, and discovering new explorers via a three-tab navigation system (Friends, Requests, Explore). The interface SHALL be optimized to prevent clashing with the bottom navigation bar by removing fixed headers.

#### Scenario: Navigating to the Explore tab
- **WHEN** the user taps the "Explore" tab in the Social screen
- **THEN** the system displays the paginated discovery interface.

#### Scenario: Sending a friend request
- **WHEN** a user enters a valid username in the social search and taps "Add"
- **THEN** a request is sent to the backend and the UI updates to show a pending request.
