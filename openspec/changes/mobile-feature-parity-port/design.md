## Context

The Astro project's web frontend has recently implemented a robust multiplayer system with 7 new minigames and cooperative HUD elements. The mobile app (React Native/Expo) currently lacks these features. This design focuses on porting the core synchronization logic and game components to achieve feature parity.

## Goals / Non-Goals

**Goals:**
- Port `multiplayerStore.js` logic to a new `multiplayerStore.ts` using Zustand.
- Implement 7 minigames in React Native, maintaining logic parity with their Vue counterparts.
- Create a reusable `MultiplayerHUD` component for mobile.
- Ensure WebSocket event handling is consistent across platforms.

**Non-Goals:**
- Implementing web-only features like mouse cursor synchronization (will be adapted to touch indicators if necessary).
- Modifying backend WebSocket emitters or listeners.

## Decisions

- **State Management (Zustand)**: We will use Zustand for the `multiplayerStore` to match the existing mobile architecture. The store will handle WebSocket connections, room state, and game actions.
- **WebSocket Implementation**: We will use the native `WebSocket` API within the Zustand store, mirroring the `connect()` and `handleMessage()` logic from the web's Pinia store.
- **Game Lifecycle Hook**: A custom `useMultiplayerGame` hook will be created to manage the mounting/unmounting of multiplayer games and their connection to the store.
- **UI Porting Strategy**: Vue templates will be translated to React Native components using `View`, `Text`, `Pressable`, and `Animated` for visual feedback. Complex SVGs will be handled via `react-native-svg`.

## Risks / Trade-offs

- **[Risk] WebSocket Instability on Mobile** → **[Mitigation]** Implement robust reconnection logic in the Zustand store (already present in the web version).
- **[Risk] UI Performance for Complex Games** → **[Mitigation]** Use `React.memo` and optimize re-renders in games with high-frequency updates like `SymmetryBreaker`.
- **[Trade-off] Touch vs. Mouse** → Some games might require interaction adjustments (e.g., larger hit areas for mobile taps compared to precise mouse clicks).
