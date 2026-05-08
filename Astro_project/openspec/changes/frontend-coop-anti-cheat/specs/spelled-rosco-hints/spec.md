## ADDED Requirements

### Requirement: Display linguistic hints to the guesser
The system SHALL display additional linguistic hints to the player who is guessing the word in SpelledRosco mode.

#### Scenario: Display Category hint
- **WHEN** it is the guesser's turn
- **THEN** the system SHALL display a `v-chip` containing the CATEGORY of the secret word

#### Scenario: Display Word Type hint
- **WHEN** it is the guesser's turn
- **THEN** the system SHALL display a `v-chip` containing the TYPE OF WORD (e.g., Verb, Noun, Adjective) derived from its suffix

### Requirement: Automatic word type derivation
The system SHALL automatically derive the word type based on the suffix of the answer.

#### Scenario: Suffix-based derivation
- **WHEN** the answer ends in "-ar", "-er", or "-ir"
- **THEN** the system SHALL identify the word type as "VERB"
