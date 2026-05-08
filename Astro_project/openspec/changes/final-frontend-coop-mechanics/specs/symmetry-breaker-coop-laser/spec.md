## ADDED Requirements

### Requirement: Simultaneous Dual-Cursor Presence
The system SHALL only allow target capture progress in Symmetry Breaker when BOTH the local player's cursor and the teammate's remote cursor are positioned within the interaction radius of the target.

#### Scenario: Both cursors on target
- **WHEN** both local and remote cursors are over the target
- **THEN** the target's capture progress bar fills over time
- **THEN** visual "coop" feedback (e.g. glowing lasers) is displayed

#### Scenario: One cursor leaves target
- **WHEN** either player moves their cursor away from the target
- **THEN** capture progress immediately stops
- **THEN** progress remains at current level or decays slowly

### Requirement: Remote Teammate Visualization
The system SHALL render a visual representation of the teammate's cursor position in real-time.

#### Scenario: Teammate moves cursor
- **WHEN** the teammate moves their mouse/touch
- **THEN** their remote cursor sprite updates position on the local screen with minimal latency
