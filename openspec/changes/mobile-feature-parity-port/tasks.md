## 1. Core Multiplayer Logic

- [x] 1.1 Create `multiplayerStore.ts` using Zustand to manage WebSocket connections and room state.
- [x] 1.2 Implement WebSocket identification and reconnection logic based on `multiplayerStore.js` from web.
- [x] 1.3 Implement room management actions (create, join, leave, invitations, challenges).
- [x] 1.4 Port `handleMessage` logic to sync real-time game state (scores, partner indicators).
- [x] 1.5 Implement Race Mode specific state (fuel timer, progress tracking).

## 2. Cooperative HUD & UI Components

- [x] 2.1 Create a reusable `FuelBar` component for Race Mode.
- [x] 2.2 Implement `CoopScoreBar` and `SharedProgressBar` for mobile layouts.
- [x] 2.3 Create `GlobalAnomalyManager` component to handle shared game events.
- [x] 2.4 Update the Multiplayer tab navigation to launch new game modes and HUDs.

## 3. Minigame Implementation - Phase 1

- [x] 3.1 Port `SpelledRosco.vue` logic to a new `SpelledRosco.tsx` React Native component.
- [x] 3.2 Implement `RadarScan.tsx` with touch-optimized sector selection.
- [x] 3.3 Port `RadioSignal.tsx` using a mobile-friendly frequency slider.
- [x] 3.4 Integrate Phase 1 games with the existing `MinigameShell.tsx`.

## 4. Minigame Implementation - Phase 2

- [x] 4.1 Port `RhymeSquad.tsx` and `SyllableQuest.tsx` to React Native.
- [x] 4.2 Implement `SymmetryBreaker.tsx` with dual-touch support for symmetrical patterns.
- [x] 4.3 Port `RouletteOverlay.tsx` for random game events.
- [x] 4.4 Ensure all new minigames correctly report scores and actions to the `multiplayerStore`.

## 5. Verification & Final Polish

- [x] 5.1 Verify WebSocket stability and state synchronization between web and mobile in a shared room.
- [x] 5.2 Test Race Mode lifecycle (fuel depletion, planet completion) on mobile devices.
- [x] 5.3 Audit touch interactions for all new minigames for responsiveness and accessibility.
