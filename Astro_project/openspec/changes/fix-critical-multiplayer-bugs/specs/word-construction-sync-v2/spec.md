## ADDED Requirements

### Requirement: Absolute Coordinate System
The Word Construction board SHALL use a normalized coordinate system (0-1000) for all network synchronization events to ensure consistency across different screen resolutions.

#### Scenario: Element move sync
- **WHEN** a player moves a letter tile
- **THEN** the system SHALL broadcast the tile ID and its new (x, y) coordinates in the normalized range
- **THEN** all other players SHALL update the tile position on their local boards

### Requirement: Shared Snap Logic
The system SHALL synchronize the "snapped" state of tiles when they reach their target slots.

#### Scenario: Successful snap
- **WHEN** a player drops a letter in a correct slot
- **THEN** the system SHALL broadcast the `ELEMENT_PLACED` event
- **THEN** the tile MUST be locked in place for all players in that slot

### Requirement: Improved Z-Index Management
The system SHALL ensure that currently dragged tiles (local or remote) are always rendered with a higher Z-Index than static tiles and board UI elements.

#### Scenario: Tile overlapping
- **WHEN** two tiles overlap
- **THEN** the tile currently being dragged MUST be visually on top
