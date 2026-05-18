## ADDED Requirements

### Requirement: WebSocket Connection Management
The mobile application SHALL maintain a persistent WebSocket connection for real-time multiplayer interactions, including automatic reconnection and user identification.

#### Scenario: Successful connection and identification
- **WHEN** the user opens the application and has a valid session
- **THEN** the system SHALL establish a WebSocket connection and send an `IDENTIFY` message with the user's token.

### Requirement: Room and Invitation Management
The system SHALL allow users to create, join, and leave multiplayer rooms, and receive real-time invitations from other players.

#### Scenario: Receiving an invitation
- **WHEN** another player sends an invitation to the current user
- **THEN** the system SHALL receive an `INVITATION_RECEIVED` message and add the invitation to the local state.

### Requirement: Real-time Game Synchronization
The system SHALL synchronize game actions, scores, and visual aids (like remote cursors or partner typing indicators) between all players in a room.

#### Scenario: Synchronizing partner typing
- **WHEN** a `GAME_ACTION` of type `PARTNER_TYPING` is received
- **THEN** the system SHALL update the `partnerText` state to reflect the partner's current input.

### Requirement: Race Mode State Management
The system SHALL manage the specific state for Race Mode, including fuel levels and progress tracking for both the player and their partner.

#### Scenario: Fuel depletion
- **WHEN** Race Mode is active
- **THEN** the system SHALL decrease the `raceFuel` level over time and trigger a game-over event if it reaches zero.

### Requirement: Unified Multiplayer State
The system SHALL provide a unified state (using the project's mobile state management library) that consolidates rooms, invitations, game status, and real-time actions.

#### Scenario: Updating available rooms
- **WHEN** a `GLOBAL_ROOMS_UPDATE` message is received
- **THEN** the system SHALL update the `availableRooms` list in the global state.
