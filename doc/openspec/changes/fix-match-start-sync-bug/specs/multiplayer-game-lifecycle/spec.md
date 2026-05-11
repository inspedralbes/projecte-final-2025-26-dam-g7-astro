## ADDED Requirements

### Requirement: Deterministic View Transition
The system SHALL ensure that Host and Guest players transition between the lobby, roulette, and game views based solely on the server-authoritative room status.

#### Scenario: Server signals PLAYING
- **WHEN** the room status updates to 'PLAYING'
- **THEN** any active `RouletteOverlay` MUST be hidden for all players
- **THEN** the corresponding mini-game component MUST be mounted for all players

### Requirement: Local Flag Independence
UI transitions SHALL NOT be blocked by local animation flags or temporary transition states if a server-side status update is received.

#### Scenario: Status change during animation
- **WHEN** the server sends a status update to 'PLAYING' while the roulette animation is still running
- **THEN** the roulette animation MUST be interrupted or hidden to show the game immediately
