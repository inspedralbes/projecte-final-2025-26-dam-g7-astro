## Context

The current mobile Social screen (`social.tsx`) implements a two-tab system (Friends, Requests) with a static header. It lacks the "Explorer" discovery feature available on the web. The search functionality is limited to direct friend requests by username. The UI layout is vertically crowded, which can lead to clashing with the bottom navigation bar on smaller devices.

## Goals / Non-Goals

**Goals:**
- Implement a three-tab navigation system: Friends, Requests, and Explore.
- Port the discovery logic (fetching all users) to the mobile app.
- Implement client-side pagination (10 users per page) with a search filter.
- Optimize the UI layout by removing the static header and integrating search into the tabs.
- Ensure visual consistency with the web version's "Explorer" cards.

**Non-Goals:**
- Implementing server-side pagination (the current backend API returns the full list).
- Modifying the backend `/api/users` endpoint.
- Implementing a full social feed or activity wall.

## Decisions

- **Client-Side Pagination**: We will fetch the full `explorers` list via the existing `socialStore.ts` and handle filtering/pagination on the client.
    - *Rationale*: Given the current user count, fetching the full list is performant and avoids complex backend changes.
- **Local State for Discovery**: `currentPage`, `searchQuery`, and `filteredExplorers` will be managed as local state within the `SocialScreen` component.
    - *Rationale*: These are transient UI states that do not require global persistence in Zustand.
- **Integrated Search UI**: The search bar will be context-specific. In the "Friends" tab, it filters friends; in "Explore", it filters the global user list.
    - *Rationale*: This maximizes screen space and provides a more intuitive user experience.
- **Layout Refactor**: Remove the `styles.header` and the "SOCIAL" title. The active tab state and icon will serve as the screen indicator.
    - *Rationale*: Frees up ~80px of vertical space, improving visibility of the list content and preventing navigation bar clashes.

## Risks / Trade-offs

- **[Risk] Performance with 1000+ users** → **[Mitigation]** Use `useMemo` for filtering/pagination. If the list grows extremely large, we will transition to `FlatList` with `windowSize` optimization.
- **[Risk] Data Freshness** → **[Mitigation]** Re-fetch the explorer list whenever the "Explore" tab is mounted or via a pull-to-refresh action.
- **[Trade-off] Client-side vs Server-side Filtering** → Filtering on the client is faster for the user after the initial load but increases memory usage. This is acceptable for the current project scale.
