# mobile-native-shell Specification

## Purpose
TBD - created by archiving change mobile-app-adaptation. Update Purpose after archive.
## Requirements
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
The system SHALL allow configuring the backend API URL and WebSocket endpoint via environment variables or a configuration file. The mobile shell SHALL also support dynamic switching between development and production endpoints based on build environment.

#### Scenario: Connection to production backend
- **WHEN** the app is built in release mode
- **THEN** it correctly identifies the production API base URL and WebSocket endpoint for all subsequent requests.

