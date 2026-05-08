## Context

The multiplayer game start flow is currently unreliable. A common issue is the guest player not transitioning to the game view after the roulette animation, or compilation errors in the `SymmetryBreaker` component preventing the game from running at all.

## Goals / Non-Goals

**Goals:**
- Fix `SymmetryBreaker.vue` compilation by removing duplicate code.
- Ensure 100% reliable transition from lobby to game for both players.
- Synchronize the game configuration between Host and Guest.

**Non-Goals:**
- Refactoring the entire multiplayer state management.
- Adding new game features.

## Decisions

### 1. Cleanup of `SymmetryBreaker.vue`
The component currently has duplicate declarations of lifecycle and game loop functions. These will be consolidated into a single version of each to satisfy the compiler and ensure consistent behavior.

### 2. Reactive Game Launch in `MultiplayerLobby.vue`
Instead of relying on a sequence of events (roulette end -> manual trigger), we will implement a robust watcher on `multiplayerStore.room.status`. When the status becomes `MATCH_STARTING` or `PLAYING`, the component will immediately bypass any pending animations or lobby logic and mount the game component using the data from `multiplayerStore.currentGame`.

### 3. Shared State Verification
Before mounting the game, the component will verify that `multiplayerStore.currentGame` and `multiplayerStore.gameConfig` are present. This ensures that both players are playing the exact same match.

## Risks / Trade-offs

- **[Risk]** Game starts before assets are ready. → **Mitigation**: The game component's own loading logic should handle asset preparation.
- **[Risk]** Guest misses the transition if they join late. → **Mitigation**: Use `{ immediate: true }` in the status watcher to handle late joins.
