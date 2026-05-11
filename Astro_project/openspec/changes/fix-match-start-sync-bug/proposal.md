## Why

Guest players in multiplayer sessions frequently get stuck in the lobby or roulette screen while the host correctly transitions to the mini-game. This desynchronization breaks the multiplayer experience and prevents matches from starting correctly for all participants.

## What Changes

- **Reactive Sync Fix**: Update the `MultiplayerLobby.vue` status watcher to use `immediate: true` to handle cases where the room status is already advanced when the component mounts.
- **Component Mount Initialization**: Explicitly initialize the active game component and roulette state during the `setup`/`onMounted` phase.
- **State Guard Cleanup**: Remove or refactor local flags (like `isSpinning` or `showRoulette`) that might block the UI transition if they are not cleared correctly upon receiving a server-side state change.
- **Event Consistency**: Ensure `MATCH_STARTING` and `ROOM_UPDATE` events trigger identical transition logic for both Host and Guest.

## Capabilities

### New Capabilities
- `multiplayer-sync-initialization`: Robust initial state handling for multiplayer lobby transitions.

### Modified Capabilities
- `multiplayer-game-lifecycle`: Improved synchronization between Host and Guest during match start and game transitions.

## Impact

- `frontend/web/src/pages/friends/MultiplayerLobby.vue`: Main logic for view transitions and reactive watchers.
- `frontend/web/src/stores/multiplayerStore.js`: Handling of match start and room update events.
- `frontend/web/src/components/games/RouletteOverlay.vue`: Ensure it doesn't block the parent component's state updates.
