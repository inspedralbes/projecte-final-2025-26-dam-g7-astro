## ADDED Requirements

### Requirement: Expo Project Initialization
The system SHALL have a base Expo project configured in `Astro_project/frontend/mobile` with all necessary dependencies for React Native and Zustand development.

#### Scenario: Project starts successfully
- **WHEN** developer runs `npx expo start` in the mobile directory
- **THEN** the Expo development server starts without errors and the app can be loaded in an emulator or device

### Requirement: Theme Synchronization
The mobile application SHALL implement a global theme system that mirrors the Astro web aesthetic (dark mode, Orbitron/Rajdhani fonts, and specific color variables).

#### Scenario: Correct theme applied
- **WHEN** the app loads
- **THEN** components render with the correct background colors and typography defined in the theme provider

### Requirement: API Base Configuration
The system SHALL allow configuring the backend API URL and WebSocket endpoint via environment variables or a configuration file.

#### Scenario: Connection to backend
- **WHEN** the app initializes
- **THEN** it correctly identifies the API base URL for subsequent requests
