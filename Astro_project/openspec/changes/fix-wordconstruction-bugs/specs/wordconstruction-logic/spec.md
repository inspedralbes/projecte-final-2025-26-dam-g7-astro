## ADDED Requirements

### Requirement: Relative cursor synchronization
The system SHALL synchronize remote cursors using percentage-based coordinates relative to the game board container.

#### Scenario: Cursor is accurately mirrored
- **WHEN** player A moves their mouse over the board
- **THEN** player B SHALL see player A's cursor at the same relative position regardless of their screen resolution.

### Requirement: High Z-Index for dragged elements
The system SHALL ensure that any element currently being dragged is rendered with a `z-index` higher than all other non-dragged UI elements in the game.

### Requirement: Functional snap-to-slot logic
The system SHALL correctly detect when a dragged letter is dropped within the proximity of its correct slot and permanently "snap" it into place.
