## ADDED Requirements

### Requirement: Host Authoritative Termination
The system SHALL only allow the Room Host to trigger the end-of-game synchronization (e.g., calling `submitRoundResult`).

#### Scenario: Guest reaches end of time
- **WHEN** the guest player's local timer reaches zero
- **THEN** the guest player SHOULD NOT emit any end-game signals to the server
- **THEN** the guest player MUST wait for the server's `ROUND_ENDED_BY_WINNER` event to transition views

### Requirement: Synchronized Game Actions
The system SHALL ensure that discrete game actions (like word destruction) are synchronized across all participants.

#### Scenario: Word destroyed by teammate
- **WHEN** the "Sniper" teammate destroys a word
- **THEN** the word MUST disappear from the "Catcher" teammate's screen immediately
