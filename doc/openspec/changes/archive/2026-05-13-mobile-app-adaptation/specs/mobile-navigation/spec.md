## ADDED Requirements

### Requirement: Bottom Tab Navigation
The application SHALL provide a bottom tab bar for primary navigation between Home, Training, Multiplayer, and Shop sections.

#### Scenario: Switching sections
- **WHEN** user taps on the "Multiplayer" tab
- **THEN** the application navigates to the multiplayer lobby screen

### Requirement: Profile Access
The application SHALL provide an accessible way (e.g., top header button or dedicated tab) to view the user profile, achievements, and settings.

#### Scenario: Opening profile
- **WHEN** user taps the profile icon in the header
- **THEN** the profile screen or drawer opens showing user stats and avatar

### Requirement: Protected Routes
The application SHALL redirect unauthenticated users to the Login/Registration screens when attempting to access protected areas.

#### Scenario: Unauthorized access attempt
- **WHEN** a user without a valid session attempts to navigate to the Training section
- **THEN** the application redirects them to the Login screen
