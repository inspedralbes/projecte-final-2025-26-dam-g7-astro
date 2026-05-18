## ADDED Requirements

### Requirement: Player can choose the background color of their friend card
Each user SHALL be able to choose the background color of the card with which they appear in OTHER players' friends and explore sections (`friends.vue`). This is the "friend card" — NOT the profile page card (`profile.vue`). The card background color is stored in the `profileColor` field.

The available colors SHALL be the same 8 curated palette colors already defined in the app:
- `#0a192f` Deep Space Blue (default)
- `#1a237e` Indigo Nebula
- `#311b92` Deep Purple Galaxy
- `#004d40` Teal Void
- `#1b5e20` Emerald Nebula
- `#b71c1c` Crimson Pulsar
- `#4a148c` Dark Matter Purple
- `#263238` Charcoal Meteor

The color picker UI SHALL be accessible from the profile settings dialog (already exists at `settingsTab === 'profile'`), clearly labeled as "Color de tu tarjeta de amigo" or equivalent, so users understand they are changing how others see them — not their own profile view.

#### Scenario: User selects a color from the picker
- **WHEN** user A opens their profile settings and clicks a color swatch under the friend card color section
- **THEN** the color is saved immediately to MongoDB via the existing `/api/user/profile-color` endpoint
- **THEN** user A's `profileColor` state in the frontend is updated locally

#### Scenario: Color applies to friend cards seen by others
- **WHEN** user A has selected `#1b5e20` (Emerald Nebula) as their card color
- **THEN** in user B's friends section, user A's card displays with a green (`#1b5e20`) tinted background
- **THEN** in the explorer/search tab, user A's card also shows the green tinted background
- **THEN** the card header gradient (rank-based) is NOT affected — only the overall card background changes

#### Scenario: Color update reaches online friends in real time
- **WHEN** user A updates their card color while user B is on the friends page
- **THEN** the backend emits a WS `FRIEND_UPDATE` to user A's friends so they trigger `fetchAllUsers()`
- **THEN** user B's view of user A's card updates to the new color without a manual page reload

#### Scenario: Color is persisted and visible after reload
- **WHEN** user A selects a card color
- **THEN** the color is saved to MongoDB (`profileColor` field on the user document)
- **THEN** when any user reloads the friends/explore page, user A's card shows the selected color
- **THEN** the default color (`#0a192f`) is used if no color has been chosen

#### Scenario: Color label clearly communicates purpose
- **WHEN** user A views the settings dialog, profile tab
- **THEN** the color picker section is labeled in a way that makes clear it controls how the friend card appears to OTHERS (e.g., "Color de tu tarjeta de amigo" or "Así te verán tus amigos")
- **THEN** the color picker does NOT affect the appearance of user A's own profile page (`profile.vue`)
