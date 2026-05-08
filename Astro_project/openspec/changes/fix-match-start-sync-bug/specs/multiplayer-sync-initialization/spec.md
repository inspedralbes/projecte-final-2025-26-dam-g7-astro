## ADDED Requirements

### Requirement: Immediate State Synchronization
The system SHALL synchronize the multiplayer lobby view with the current room status immediately upon component mount or state change.

#### Scenario: Joining an active roulette
- **WHEN** the guest player enters the lobby while the room status is 'ROULETTE'
- **THEN** the `RouletteOverlay` MUST be displayed immediately without waiting for a state transition event

#### Scenario: Joining an active game
- **WHEN** the guest player enters the lobby while the room status is 'PLAYING'
- **THEN** the `activeGameComponent` MUST be mounted immediately to show the current mini-game
