## Why

The multiplayer game is experiencing critical blocking issues. Specifically, `SymmetryBreaker.vue` contains duplicate function definitions that cause Vite compilation errors, and `MultiplayerLobby.vue` fails to reliably synchronize the start of the game for both players after the roulette animation.

## What Changes

- **SymmetryBreaker.vue Cleanup**: Remove all duplicate functions (`update`, `lockTarget`, `draw`, `gameLoop`, `handlePointerMove`) to restore compilation.
- **Synchronized Game Start**: Modify `MultiplayerLobby.vue` to ensure that both Host and Guest transition to the game immediately when the room status changes to `PLAYING` or `MATCH_STARTING`, reading the shared game configuration from `multiplayerStore`.

## Capabilities

### New Capabilities
- `multiplayer-sync-start`: Ensures all players in a room start the game at the same time with the same configuration.

### Modified Capabilities
<!-- None -->

## Impact

- `frontend/web/src/components/games/SymmetryBreaker.vue`
- `frontend/web/src/pages/friends/MultiplayerLobby.vue`
- `multiplayerStore` (read-only usage)
