## ADDED Requirements

### Requirement: Cooperative Fuel Bar
The mobile application SHALL display a real-time fuel bar during Race Mode that reflects the current fuel level synchronized with the multiplayer store.

#### Scenario: Visualizing fuel recharge
- **WHEN** a `FUEL_RECHARGE` action is processed
- **THEN** the fuel bar SHALL visually increase to match the new state.

### Requirement: Shared Progress HUD
The system SHALL provide a visual HUD that shows the progress of all team members relative to the current game goal (e.g., planets in Race Mode).

#### Scenario: Partner completes a planet
- **WHEN** the partner's progress updates to a new planet
- **THEN** the progress HUD SHALL update the partner's indicator position.

### Requirement: Global Anomaly Management
The mobile application SHALL display and handle "Global Anomalies" that affect all players in a room, requiring specific touch interactions to resolve.

#### Scenario: Anomaly appearing
- **WHEN** a `GLOBAL_ANOMALY` event is received from the server
- **THEN** the system SHALL overlay the anomaly visual effect on the screen and enable interaction handlers.

### Requirement: Role-based HUD
The UI SHALL adapt based on the user's current sub-role (e.g., Pilot vs. Engineer) to show relevant tools and information.

#### Scenario: Engineer view
- **WHEN** the user is assigned the `ENGINEER` role
- **THEN** the HUD SHALL emphasize fuel management and anomaly resolution tools.
