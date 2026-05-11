## ADDED Requirements

### Requirement: Deterministic Word Shuffling
The system SHALL ensure that both players in a cooperative Syllable Quest session see the exact same shuffled order of words for a given sentence.

#### Scenario: Shared board initialization
- **WHEN** a multiplayer session starts
- **THEN** the host generates a random permutation and broadcasts it to the teammate
- **THEN** both players render the word buttons in that specific order

### Requirement: Synchronized Word Selection
The system SHALL synchronize word selection actions in real-time. When a player clicks a word, it must be marked as selected or removed for both players if it is the correct next word in the sequence.

#### Scenario: Teammate clicks correct word
- **WHEN** Player A clicks the next correct word in the sequence
- **THEN** the word button is updated to a "success" state or removed for both Player A and Player B
- **THEN** the progress counter increments for both

#### Scenario: Player clicks incorrect word
- **WHEN** any player clicks a word out of sequence
- **THEN** the current progress for the sentence resets for both players
- **THEN** a visual error feedback is shown to both
