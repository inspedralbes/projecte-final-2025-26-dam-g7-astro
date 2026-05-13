## ADDED Requirements

### Requirement: Friend Management Interface
The mobile app SHALL provide an interface for viewing the user's friends list, sending new friend requests by username, and managing incoming requests.

#### Scenario: Sending a friend request
- **WHEN** a user enters a valid username in the social search and taps "Add"
- **THEN** a request is sent to the backend and the UI updates to show a pending request.

### Requirement: Global Social Synchronization
The social state (friends, requests, online status) SHALL be synchronized across the application using a dedicated Zustand store that updates in real-time or on-demand.

#### Scenario: Accepting an incoming request
- **WHEN** a user taps "Accept" on a pending friend request
- **THEN** the contact is added to the friends list and removed from the requests list.
