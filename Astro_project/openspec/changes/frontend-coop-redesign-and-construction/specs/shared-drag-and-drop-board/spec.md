## ADDED Requirements

### Requirement: Real-time Coordinate Sync
In Word Construction, the (x, y) coordinates of a letter being dragged by one player SHALL be synchronized to the other player's screen in real-time.

#### Scenario: Teammate drags a letter
- **WHEN** Player A drags a letter across the board
- **THEN** Player B sees that specific letter moving in synchronization on their screen

### Requirement: Drag Locking
To prevent race conditions, a letter currently being dragged by one player SHALL be "locked" for the other player until released.

#### Scenario: Attempting to grab a locked letter
- **WHEN** Player A is already dragging Letter ID 5
- **THEN** Player B is unable to initiate a drag on Letter ID 5 until Player A releases it

### Requirement: Remote Cursor Feedback
The position of the teammate's mouse pointer SHALL be rendered on the board during multiplayer sessions.

#### Scenario: Remote cursor visibility
- **WHEN** the teammate moves their mouse
- **THEN** a visual indicator (remote cursor) is displayed at the corresponding position on the local board
