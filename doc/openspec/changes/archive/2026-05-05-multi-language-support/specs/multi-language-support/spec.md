## ADDED Requirements

### Requirement: Multi-Locale Support
The system SHALL support English (en), Spanish (es), and Catalan (ca) locales.

#### Scenario: Switch to English
- **WHEN** the user selects "English" from the language selector
- **THEN** the interface SHALL display all text in English

### Requirement: Component Internationalization
All user-facing components, including the landing page, sidebars (Left and Right), and the Chat Drawer, SHALL use translation keys instead of hardcoded strings.

#### Scenario: Translated Right Sidebar
- **WHEN** the language is set to Catalan
- **THEN** the "ESTADO DEL PILOTO" header SHALL display as "ESTAT DEL PILOT" (or equivalent Catalan translation)

### Requirement: Persistent Language Selection
The system SHALL store the user's language preference in `localStorage` and apply it on application load.

#### Scenario: Selection persistence
- **WHEN** the user selects "English" and refreshes the browser
- **THEN** the application SHALL load in English

### Requirement: Automated Localization Testing
The system SHALL have automated tests to verify that the language switching logic and storage are functioning correctly.

#### Scenario: Verification via test
- **WHEN** the i18n test suite is executed
- **THEN** it SHALL verify that changing the locale correctly updates the global `vue-i18n` instance
