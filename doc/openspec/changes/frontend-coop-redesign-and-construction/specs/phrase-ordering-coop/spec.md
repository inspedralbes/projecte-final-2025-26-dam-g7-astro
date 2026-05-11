## ADDED Requirements

### Requirement: Shared Phrase Display
In multiplayer mode, Syllable Quest SHALL display a jumbled phrase where each word is a clickable button. Both players MUST see the same shuffled order.

#### Scenario: Teammates see synchronized shuffled words
- **WHEN** a round starts
- **THEN** both players see the same words in the same jumbled order on their screens

### Requirement: Cooperative Phrase Ordering
Players SHALL reconstruct the phrase by clicking words in the correct sequence. The progress MUST be shared between teammates.

#### Scenario: Collaborative correct click
- **WHEN** Player A clicks the first correct word in the sequence
- **THEN** that word is highlighted for both players, and the shared progress index increments

### Requirement: Incorrect Click Penalty
If any player clicks a word out of sequence, the shared progress SHALL reset or a penalty SHALL be applied.

#### Scenario: Out of sequence click
- **WHEN** Player B clicks a word that is not the next in the sequence
- **THEN** the highlighted words are reset for both players and a time penalty is applied
