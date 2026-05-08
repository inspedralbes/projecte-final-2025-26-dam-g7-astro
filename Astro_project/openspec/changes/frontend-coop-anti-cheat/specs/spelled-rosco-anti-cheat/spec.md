## ADDED Requirements

### Requirement: Text-based hint input
The system SHALL replace the emoji-based hint selector with a text input field (`v-text-field`) for sending clues.

#### Scenario: User types a hint
- **WHEN** the player enters text in the hint field
- **THEN** the system displays the text as it is typed

### Requirement: Advanced hint validation
The system SHALL validate the text hint before sending to ensure it is not the exact secret word or an obfuscated version of it.

#### Scenario: Normalization of input
- **WHEN** a player types a hint with accents, uppercase, or spaces (e.g., "Árbol ")
- **THEN** the system SHALL convert it to lowercase and remove accents, spaces, and symbols (e.g., "arbol") for validation purposes

#### Scenario: Exact word detection
- **WHEN** the normalized hint matches the secret word exactly
- **THEN** the system SHALL block the input and show an error message

#### Scenario: Obfuscated word detection (RegEx)
- **WHEN** the hint contains the secret word with 1 to 2 characters between letters (e.g., "S.O.L" for "SOL")
- **THEN** the system SHALL detect this using a dynamic RegEx (e.g., `s.{0,2}o.{0,2}l`) and block the input

#### Scenario: Validation failure feedback
- **WHEN** a cheating attempt or exact word is detected
- **THEN** the system SHALL empty the input field and display an error warning to the player
