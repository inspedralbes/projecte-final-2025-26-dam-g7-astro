## Context

The Astro platform is currently a web-only application. To expand its reach, we are developing a native mobile application. The current web stack (Vue 3, Vuetify, Pinia) needs to be translated into the mobile stack (Expo, React Native, Zustand) while maintaining the same backend and business logic.

## Goals / Non-Goals

**Goals:**
- Implement a functional Expo-based mobile application.
- Port all core training and multiplayer features to mobile.
- Use Zustand for state management as per project rules.
- Maintain visual consistency with the "Astro" glassmorphism aesthetic.
- Ensure WebSocket synchronization for multiplayer modes works on mobile.

**Non-Goals:**
- Rewriting the backend API.
- Replicating administrative features (Teacher/Center views) in the first mobile phase.
- Implementing offline mode (first phase requires internet for training/sync).

## Decisions

### 1. Expo (React Native) + Zustand
We will use Expo for the mobile framework to ensure fast development and native-like performance for minigames. Zustand will be used for state management, providing a performant and lightweight alternative to Pinia that is native to the React ecosystem.

### 2. Navigation Structure
We will implement a Tab-based navigation for the main sections (Home, Training, Multiplayer, Shop) and a Drawer or Modal-based profile access to mirror the web's layout while optimizing for mobile ergonomics.

### 3. Glassmorphism Adaptation
The web's "Astro" aesthetic (translucent panels, blurs, neon glows) will be implemented using:
- `expo-blur` for translucent panels.
- `react-native-shadow-2` for complex neon glows.
- Custom SVG components for game icons and UI elements.

### 4. WebSocket Client Implementation
We will use the native `WebSocket` API supported by React Native, wrapping it in a Zustand store similar to the web's `multiplayerStore.js`. This ensures that real-time game actions and chat persist across the mobile application's lifecycle.

### 5. Shared Logic Extraction
We will investigate extracting core business logic (e.g., `inventory.js`, `progression.js`) into a `shared/` directory that can be referenced by both the web and mobile projects (possibly using a monorepo-like structure or symlinks if necessary, though initial implementation might involve duplication for simplicity).

## Risks / Trade-offs

- **[Risk]** Complexity of porting Vue-based game logic to React components. → **Mitigation**: Create a clear mapping of game state and use functional components with `useReducer` or specialized Zustand sub-stores for game logic.
- **[Risk]** WebSocket disconnections on mobile networks. → **Mitigation**: Implement robust reconnection logic and state synchronization on re-entry.
- **[Risk]** Performance of blur effects on older mobile devices. → **Mitigation**: Use conditional rendering or fallbacks for translucency if device performance is low.
