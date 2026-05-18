## ADDED Requirements

### Requirement: Paginated Explorer List
The system SHALL display all registered users (explorers) in a list with a maximum of 10 users per page.

#### Scenario: Navigating between pages
- **WHEN** the user taps "Next" on the first page of 10 users
- **THEN** the system displays the next set of 10 users.

### Requirement: Explorer Search
The system SHALL filter the explorer list based on a search query entered by the user.

#### Scenario: Searching for a specific explorer
- **WHEN** the user types "Alex" in the explorer search bar
- **THEN** the list updates to show only users whose names contain "Alex".

### Requirement: Friend Recruitment Action
The explorer list SHALL allow users to send friend requests to anyone who is not already a friend.

#### Scenario: Recruiting from discovery
- **WHEN** the user taps "Recruit" on an explorer card
- **THEN** a friend request is sent to that explorer.
