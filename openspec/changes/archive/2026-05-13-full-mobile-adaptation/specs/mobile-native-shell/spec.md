## MODIFIED Requirements

### Requirement: API Base Configuration
The system SHALL allow configuring the backend API URL and WebSocket endpoint via environment variables or a configuration file. The mobile shell SHALL also support dynamic switching between development and production endpoints based on build environment.

#### Scenario: Connection to production backend
- **WHEN** the app is built in release mode
- **THEN** it correctly identifies the production API base URL and WebSocket endpoint for all subsequent requests.
