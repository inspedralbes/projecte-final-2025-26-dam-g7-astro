## ADDED Requirements

### Requirement: Supported Languages
The system SHALL support English (en), Spanish (es), and Catalan (ca) as primary languages for the web interface.

#### Scenario: Language switching
- **WHEN** the user selects a different language from the language selector
- **THEN** the entire user interface SHALL immediately update to display text in the selected language

### Requirement: Persistent Language Selection
The system SHALL store the user's language preference in `localStorage` to ensure the choice persists across sessions.

#### Scenario: Persistence across reload
- **WHEN** the user selects "English" and refreses the page
- **THEN** the page SHALL load in "English" automatically

### Requirement: Unified Language Selector
A unified language selector component SHALL be available on the landing page and within the application's sidebar.

#### Scenario: Selection from landing page
- **WHEN** a guest user changes the language on the landing page
- **THEN** the landing page content SHALL update to the new language

### Requirement: Default Language and Fallback
The system SHALL default to Spanish (es) if no language preference is found, and SHALL fallback to Spanish if a translation key is missing in the selected language.

#### Scenario: First visit
- **WHEN** a user visits the platform for the first time with no stored preference
- **THEN** the system SHALL display content in Spanish by default
