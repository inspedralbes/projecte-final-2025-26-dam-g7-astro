## ADDED Requirements

### Requirement: RhymeSquad 2vs2 roles
The system SHALL define two distinct roles for the 2vs2 mode: Catcher and Sniper.

#### Scenario: Catcher role behavior
- **WHEN** a player is assigned the Catcher role
- **THEN** they SHALL be able to move the spaceship to catch valid rhymes

#### Scenario: Sniper role behavior
- **WHEN** a player is assigned the Sniper role
- **THEN** they SHALL be able to click on "trash" (invalid) words to destroy them

### Requirement: Shared visual feedback
The system SHALL synchronize visual information between partners in RhymeSquad.

#### Scenario: Remote cursor visibility
- **WHEN** the Sniper moves their mouse
- **THEN** the Catcher SHALL see the Sniper's `remoteCursor` on their screen in real-time

### Requirement: Synchronized word destruction
The system SHALL ensure that when a word is destroyed by the Sniper, it disappears for both players simultaneously.

#### Scenario: Sniper destroys a word
- **WHEN** the Sniper clicks on a false word
- **THEN** an event SHALL be emitted that removes the word from both the Sniper's and the Catcher's game state immediately
