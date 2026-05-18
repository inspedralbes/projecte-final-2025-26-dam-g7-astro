## 1. Localization & Store Preparation

- [x] 1.1 Add new translation keys for discovery (tabs.explore, recruit, pagination.next, pagination.prev, empty_explore) in `Astro_project/frontend/mobile/i18n/locales/`.
- [x] 1.2 Ensure `useSocialStore` properly initializes and fetches the `explorers` list from the backend.

## 2. Social Screen Layout Refactor

- [x] 2.1 Remove the static header and "SOCIAL" title from `Astro_project/frontend/mobile/app/(tabs)/social.tsx`.
- [x] 2.2 Update the `activeTab` state and the tab selection UI to support three tabs: `friends`, `requests`, and `explore`.
- [x] 2.3 Adjust styling to ensure the content area expands to the full available vertical space.

## 3. Explorer Discovery Feature

- [x] 3.1 Implement client-side pagination logic in `SocialScreen.tsx` (state for `currentPage`, constant for `pageSize=10`).
- [x] 3.2 Implement the search filtering logic for the `explorers` list using `useMemo`.
- [x] 3.3 Add the "Explore" tab content view, including the search input and the list of user cards.
- [x] 3.4 Implement a "Recruit" user card component that displays level, rank, and a button to send friend requests.
- [x] 3.5 Add pagination controls (Previous/Next) at the bottom of the Explore list.

## 4. Verification & Styling

- [x] 4.1 Apply Astro-themed styling (glass effects, cyan glows) to the new discovery elements.
- [x] 4.2 Test the end-to-end flow: Searching for a user -> Paginated navigation -> Sending a friend request.
- [x] 4.3 Verify that the UI layout is stable across different device orientations and screen sizes.
