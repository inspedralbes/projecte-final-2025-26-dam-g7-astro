# mobile-minigame-suite Specification

## Purpose
Collection of touch-optimized cognitive training games with unified game-over and scoring logic.

## Requirements
### Requirement: Unified Minigame Lifecycle
The system SHALL provide a unified framework for launching, pausing, and concluding minigames, ensuring consistent scoring and data synchronization with the backend.

#### Scenario: Game concludes with success
- **WHEN** a minigame reaches its natural end or goal and the score is above the required threshold
- **THEN** the system triggers a "Game Over" event, displays the final score, and calls the `registerCompletedGame` action.

### Requirement: Touch-Optimized Word Construction
The Word Construction minigame SHALL allow users to reorder letters via touch-and-drag interactions to form a target word based on a hint.

#### Scenario: User correctly orders a word
- **WHEN** the user drags letters into the correct sequence and taps "Build"
- **THEN** the word is validated, points are awarded, and the next word is presented.

### Requirement: Game State Persistence
Minigames SHALL maintain their internal state (timer, score, level) during the active session and ensure that critical data is sent to the server upon completion.

#### Scenario: User loses connection during game
- **WHEN** the network connection is lost while a game is active
- **THEN** the game allows completion but shows a warning that data will be synced once connection is restored.
