## ADDED Requirements

### Requirement: Real-time Shared Letter Positions
The system SHALL synchronize the (x, y) coordinates of letter tiles on the Word Construction board across both teammates' screens in real-time.

#### Scenario: Teammate drags a letter
- **WHEN** Player B drags a letter tile
- **THEN** Player A sees that specific letter tile moving in sync on their screen
- **THEN** Player A sees Player B's remote cursor near the letter tile

### Requirement: Exclusive Letter Interaction (Locking)
The system SHALL prevent both players from interacting with the same letter tile simultaneously to avoid state conflicts.

#### Scenario: Contested letter interaction
- **WHEN** Player A starts dragging Letter X
- **THEN** Letter X becomes "locked" for Player B
- **THEN** Player B cannot click or drag Letter X until Player A releases it
