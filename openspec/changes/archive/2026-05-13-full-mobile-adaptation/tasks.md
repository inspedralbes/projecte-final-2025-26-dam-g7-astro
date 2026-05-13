## 1. Global State & Infrastructure

- [x] 1.1 Implement `useProgressStore` in Zustand, porting logic for XP, level, and map progress.
- [x] 1.2 Implement `useInventoryStore` in Zustand for shop balance and item management.
- [x] 1.3 Implement `useSocialStore` in Zustand for friends list and request handling.
- [x] 1.4 Implement `useAchievementsStore` in Zustand for unlocked achievements.
- [x] 1.5 Update `useSessionStore` to support dynamic API/WS endpoint switching for prod/dev.

## 2. Spatial Map Implementation

- [x] 2.1 Create the `SpatialMap` component using a vertical `ScrollView`.
- [x] 2.2 Implement the `MapNode` component with different visual states (locked, current, completed).
- [x] 2.3 Draw SVG paths between nodes using `react-native-svg` to visualize the sequence.
- [x] 2.4 Add phase dividers (e.g., Earth, Solar System) with titles and icons from the web version.
- [x] 2.5 Build the `LevelPreview` modal that shows game details and the \"Start\" button.

## 3. Minigame Suite - Core & Word Construction

- [x] 3.1 Create a `MinigameShell` component to handle shared logic (timer, game-over, score sync).
- [x] 3.2 Port `wordConstructionLogic` to a reusable React Hook.
- [x] 3.3 Implement the `WordConstruction` view using `react-native-gesture-handler` for letter dragging.
- [x] 3.4 Integrate the game-over flow to call `astroStore.registerCompletedGame` and update global state.

## 4. Social & Commercial Modules

- [x] 4.1 Build the `ShopScreen` with category filtering and purchase validation.
- [x] 4.2 Build the `InventoryScreen` allowing users to view and activate boosters/streak freezes.
- [x] 4.3 Build the `SocialScreen` featuring the friends list and incoming request management.
- [x] 4.4 Build the `AchievementsScreen` to showcase unlocked trophies and selected banners.

## 5. Polish & Integration

- [x] 5.1 Implement global glassmorphism styles and Astro-themed buttons/cards.
- [x] 5.2 Add localized strings for all new mobile interfaces in `i18n`.
- [x] 5.3 Conduct a final audit of API synchronization across all new stores and screens.
