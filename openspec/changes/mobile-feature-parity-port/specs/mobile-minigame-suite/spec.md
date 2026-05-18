## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Touch-Optimized Spelled Rosco
The system SHALL provide a touch-optimized "Rosco" game where users can select letters and type definitions via a mobile-friendly input.

#### Scenario: Completing a Rosco letter
- **WHEN** the user submits the correct word for a letter
- **THEN** the letter turns green and the next letter is highlighted.

### Requirement: Radar Scan Interaction
The system SHALL provide a Radar Scan game where users tap on specific screen sectors to identify targets within a time limit.

#### Scenario: Successful scan
- **WHEN** the user taps a valid target on the radar grid
- **THEN** the target is cleared and the scan progress increases.

### Requirement: Radio Signal Frequency Matching
The system SHALL provide a Radio Signal game where users use a slider to match a target frequency.

#### Scenario: Frequency match
- **WHEN** the slider reaches the target frequency range
- **THEN** the signal is "locked" and points are awarded.

### Requirement: Symmetry Breaker
The system SHALL provide a Symmetry Breaker game requiring coordinated taps on symmetrical patterns.

#### Scenario: Breaking symmetry
- **WHEN** the user taps the correct symmetrical counterpart
- **THEN** the pattern is cleared.
