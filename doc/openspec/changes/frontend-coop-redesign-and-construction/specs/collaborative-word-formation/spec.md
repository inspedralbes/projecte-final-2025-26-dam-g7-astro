## ADDED Requirements

### Requirement: Shared Word Target
Both players in a 2vs2 team SHALL see and work towards the same target word completion.

#### Scenario: Teammate places correct letter
- **WHEN** Player A drops a letter into the correct slot for the target word
- **THEN** the word's completion progress is updated for both players

### Requirement: Synchronized Board Layout
The initial position of all letters on the board MUST be identical for both teammates.

#### Scenario: Board initialization
- **WHEN** a new Word Construction round starts
- **THEN** the host generates the layout and broadcasts it so both players see the same jumbled letter positions
