## Why

The mobile "Social" screen is currently limited to searching for friends by exact username and has a crowded UI that clashes with the bottom navigation bar. Porting the "Explore" feature from the web version will allow users to discover new players through a paginated list and integrated search, providing feature parity with the web platform.

## What Changes

- **Explore Tab**: A new tab in the Social screen dedicated to discovering all users in the Astro system.
- **Pagination**: Implementation of client-side pagination (10 users per page) to handle the potentially large user list efficiently.
- **Integrated Search**: A contextual search bar within the Explore tab for real-time user filtering.
- **UI Cleanup**: Removal of the static "SOCIAL" header to free up vertical space and prevent clashing with the bottom navigation menu.
- **Discovery Cards**: Mobile-optimized user cards showing level, rank, and "Add Friend" actions.

## Capabilities

### New Capabilities
- `mobile-user-discovery`: A paginated and searchable interface to browse all system users for social discovery.

### Modified Capabilities
- `mobile-social-hub`: Updating the navigation and layout of the Social screen to accommodate the discovery feature and optimize screen space.

## Impact

- **Frontend (Mobile)**: `Astro_project/frontend/mobile/app/(tabs)/social.tsx` will be refactored to include the new tab and pagination logic.
- **State Management**: `Astro_project/frontend/mobile/stores/socialStore.ts` will be used to fetch the full explorer list.
- **Localization**: Updates to `Astro_project/frontend/mobile/i18n/locales/` for new discovery-related strings.
- **Navigation**: Layout adjustments to improve usability on smaller screens.
