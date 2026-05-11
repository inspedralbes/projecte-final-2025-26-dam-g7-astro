## ADDED Requirements

### Requirement: Unlimited audio signaling
The system SHALL remove any cooldown restrictions from the audio signal button in Radio Signal mode.

#### Scenario: Rapid audio signals
- **WHEN** a player clicks the audio signal button multiple times in quick succession
- **THEN** the system SHALL emit the audio signal for each click without delay

### Requirement: Cooperative text chat
The system SHALL provide a text-based mini-chat for players to communicate the signal phrases.

#### Scenario: Sending a chat message
- **WHEN** a player types a message in the mini-chat and sends it
- **THEN** the message SHALL be transmitted via `multiplayerStore` and displayed to both cooperative partners

#### Scenario: Receiving a chat message
- **WHEN** a partner sends a message
- **THEN** the message SHALL appear instantly in the other player's chat interface
