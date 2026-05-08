## ADDED Requirements

### Requirement: Host-Driven Board Generation
The system SHALL ensure that the game board (letters and target positions) is generated exclusively by the Host and synchronized with the Guest at the start of each round.

#### Scenario: Round initialization
- **WHEN** a new round of RadarScan begins
- **THEN** the Host MUST generate the layout and emit a `BOARD_SYNC` message
- **THEN** the Guest MUST render the exact same board configuration

### Requirement: Shared Illumination (Flashlight)
The system SHALL visualize the teammate's cursor position as a secondary "flashlight" beam on the local player's screen.

#### Scenario: Teammate moves flashlight
- **WHEN** the teammate moves their mouse
- **THEN** a radial gradient MUST be rendered at the teammate's coordinates on the local player's overlay
- **THEN** both players SHOULD be able to see the area illuminated by each other
