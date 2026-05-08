## ADDED Requirements

### Requirement: Low-Latency Game Action Broadcasting
The system SHALL provide a mechanism to broadcast discrete game actions (clicks, sequence resets) to teammates with minimal overhead.

#### Scenario: Sending a click action
- **WHEN** a player performs a valid game action
- **THEN** the action is emitted via the multiplayer store
- **THEN** the teammate receives the action and updates their local game state accordingly

### Requirement: Throttled State Synchronization
The system SHALL provide a mechanism to synchronize continuous state (positions, cursors) using throttling to maintain performance and prevent network congestion.

#### Scenario: Cursor position update
- **WHEN** a player moves their cursor
- **THEN** position updates are emitted at a maximum frequency (e.g. every 30ms)
- **THEN** the teammate's view is updated smoothly
