## ADDED Requirements

### Requirement: Host detection in SymmetryBreaker
The `SymmetryBreaker.vue` component SHALL correctly identify if the current player is the host.

#### Scenario: Host is correctly identified
- **WHEN** the component is mounted
- **THEN** it SHALL have an `isHost` computed property that returns `true` if the local user is the room host.

### Requirement: Consistency across minigames
All minigame components using host-specific logic SHALL have a valid definition for `isHost`.

#### Scenario: Audit minigames
- **WHEN** a minigame component is loaded
- **THEN** it SHALL NOT throw a `ReferenceError` for `isHost`.
