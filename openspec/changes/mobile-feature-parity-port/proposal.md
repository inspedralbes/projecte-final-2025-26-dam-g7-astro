## Why

The web version of the Astro project has recently received a major update via a merge, introducing a suite of 7 new minigames, advanced multiplayer synchronization logic, and cooperative gameplay mechanics (HUD, anomalies). Currently, the mobile application only supports one minigame and lacks the full multiplayer experience, creating a significant feature gap between platforms. This change aims to achieve feature parity by porting the web's gameplay and synchronization logic to React Native.

## What Changes

- **Minigame Porting**: Implementation of 7 new minigames in React Native: `SpelledRosco`, `RadarScan`, `RadioSignal`, `RhymeSquad`, `SyllableQuest`, `SymmetryBreaker`, and `RouletteOverlay`.
- **Multiplayer Logic**: Migration of the `multiplayerStore` and `astroShared` logic from Vue/Pinia to React Native/Zustand (or the project's mobile state management) to handle real-time synchronization.
- **Cooperative HUD**: Implementation of mobile-optimized versions of `FuelBar`, `CoopScoreBar`, and `GlobalAnomalyManager`.
- **Game Lifecycle**: Unified game lifecycle management for all new minigames, ensuring consistent integration with the mobile shell.

## Capabilities

### New Capabilities
- `mobile-multiplayer-logic`: Porting of the complex multiplayer state machine and WebSocket event handling from web to mobile.
- `mobile-coop-mechanics`: Implementation of cooperative visual elements and anomaly-handling logic for mobile screens.

### Modified Capabilities
- `mobile-minigame-suite`: Expanding the suite to include requirements for the 7 new games, ensuring touch-optimized interactions for each.

## Impact

- **Frontend (Mobile)**: Major expansion of the `components/games` and `stores` directories.
- **State Management**: New stores for multiplayer and cooperative state.
- **Navigation**: Minor updates to the Multiplayer tab to launch the new game modes.
- **Dependencies**: Potential addition of touch-handling or animation libraries if needed for specific minigames.
