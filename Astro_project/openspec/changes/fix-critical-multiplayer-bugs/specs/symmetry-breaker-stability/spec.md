## ADDED Requirements

### Requirement: Single-Instance Animation Loop
The system SHALL maintain a single, clean animation and logic update loop within the Symmetry Breaker component.

#### Scenario: Component initialization
- **WHEN** the Symmetry Breaker component is mounted
- **THEN** it MUST NOT have duplicate definitions of `update` or `draw` functions in the source code
- **THEN** it MUST use a single `requestAnimationFrame` instance

### Requirement: Discrete Score Increment
The system SHALL only increment the player's score upon the successful completion of a target capture event.

#### Scenario: Capturing a target
- **WHEN** a target is fully captured
- **THEN** the score MUST increase by the defined amount
- **THEN** no further score increases SHALL occur until the next successful capture
