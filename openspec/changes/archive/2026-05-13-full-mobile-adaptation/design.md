## Context

The Astro mobile application (Expo/React Native) currently lacks functional parity with the desktop web version (Vue 3/Vuetify). While the core shell and authentication are present, the primary value proposition—the cognitive training map and minigames—remains largely unimplemented as placeholders.

## Goals / Non-Goals

**Goals:**
- Implement functional parity for all core training, social, and commercial features.
- Adapt the vertical spatial map to a mobile-friendly scrollable interface.
- Port all 7 training minigames to touch-optimized React Native components.
- Centralize global state using Zustand to mirror Pinia's multi-store architecture.

**Non-Goals:**
- Implementing "Career" mode or advanced competitive features not yet standardized in the web version.
- Redesigning the backend API; mobile must consume existing endpoints.
- Optimizing for tablet-specific layouts (focus is on handheld mobile devices).

## Decisions

### 1. Zustand Store Architecture
- **Decision**: Create individual stores for `useProgressStore`, `useInventoryStore`, `useSocialStore`, and `useAchievementsStore`.
- **Rationale**: Mirrors the desktop architecture, making the porting of logic more direct and maintaining clear separation of concerns.
- **Alternative**: A single "monolithic" store. Rejected due to complexity and potential performance issues during updates.

### 2. Spatial Map Implementation
- **Decision**: Use a vertical `ScrollView` with absolute-positioned node components and SVG connectors (`react-native-svg`).
- **Rationale**: The desktop map uses a similar approach but is optimized for horizontal/diagonal flow. Vertical flow is more natural for mobile scrolling.
- **Alternative**: A canvas-based rendering. Rejected due to higher development complexity and lack of native accessibility for nodes.

### 3. Minigame Porting Strategy
- **Decision**: Extract game logic into reusable React Hooks (e.g., `useWordConstructionLogic`) and use native components for the view layer.
- **Rationale**: Separation of logic and view allows for easier testing and adaptation of touch interactions (using `react-native-gesture-handler`) without rewriting game rules.
- **Alternative**: Webview-based embedding of the Vue components. Rejected due to poor performance, lack of native feel, and technical constraints of the project.

### 4. Glassmorphism on Mobile
- **Decision**: Use `expo-blur` and semi-transparent backgrounds with borders.
- **Rationale**: Maintains the "Astro" aesthetic across platforms while using native-optimized blurring.

## Risks / Trade-offs

- **[Risk] High memory usage from 7 games** → **Mitigation**: Lazy load game components and clear state upon game-over/exit.
- **[Risk] Touch interaction latency** → **Mitigation**: Use `react-native-reanimated` for all UI transitions and ensure `onPress` events are responsive.
- **[Risk] UI fragmentation across screen sizes** → **Mitigation**: Use a flexible grid system and percentage-based widths for game elements.
