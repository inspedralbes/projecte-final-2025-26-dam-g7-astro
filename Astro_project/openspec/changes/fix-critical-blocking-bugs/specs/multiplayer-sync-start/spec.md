## ADDED Requirements

### Requirement: Immediate synchronization of game start
The system SHALL ensure that all players in a multiplayer room transition to the game view immediately when the room status becomes `PLAYING` or `MATCH_STARTING`.

#### Scenario: Host and Guest start simultaneously
- **WHEN** the room status changes to `PLAYING` or `MATCH_STARTING`
- **THEN** both Host and Guest components SHALL destroy the roulette view and mount the minijuego component immediately.

### Requirement: Shared game configuration
The system SHALL ensure that both players use the same `currentGame` and `gameConfig` from the `multiplayerStore` to ensure identical gameplay.

#### Scenario: Players use same config
- **WHEN** the game starts
- **THEN** both players SHALL read `currentGame` and `gameConfig` from the `multiplayerStore`.
