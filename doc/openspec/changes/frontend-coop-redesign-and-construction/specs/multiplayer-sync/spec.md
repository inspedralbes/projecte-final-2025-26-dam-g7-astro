## ADDED Requirements

### Requirement: Element Drag Payload
The synchronization system SHALL support payloads for element dragging, including element ID and (x, y) coordinates.

#### Scenario: Sending drag action
- **WHEN** a local drag move event occurs
- **THEN** an `ELEMENT_MOVE` action is sent with the target ID and new coordinates

### Requirement: Phrase Click Payload
The synchronization system SHALL support payloads for phrase word clicks.

#### Scenario: Sending phrase click
- **WHEN** a player clicks a word in a jumbled phrase
- **THEN** a `PHRASE_CLICK` action is sent with the word index or ID
