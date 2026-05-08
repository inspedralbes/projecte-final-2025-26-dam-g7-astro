## 1. Clean up SymmetryBreaker.vue

- [x] 1.1 Identify and remove duplicate `update` function in `SymmetryBreaker.vue` (Verified clean)
- [x] 1.2 Identify and remove duplicate `lockTarget` function in `SymmetryBreaker.vue` (Verified clean)
- [x] 1.3 Identify and remove duplicate `draw` function in `SymmetryBreaker.vue` (Verified clean)
- [x] 1.4 Identify and remove duplicate `gameLoop` function in `SymmetryBreaker.vue` (Verified clean)
- [x] 1.5 Identify and remove duplicate `handlePointerMove` function in `SymmetryBreaker.vue` (Verified clean)
- [x] 1.6 Verify that Vite compilation errors are resolved

## 2. Sync Start in MultiplayerLobby.vue

- [x] 2.1 Refactor room status watcher in `MultiplayerLobby.vue` to use `{ immediate: true }`
- [x] 2.2 Implement immediate transition to game component when room status is `MATCH_STARTING` or `PLAYING`
- [x] 2.3 Ensure `currentGame` and `gameConfig` are correctly synchronized from `multiplayerStore`
- [x] 2.4 Bypass or remove legacy roulette-end-trigger logic to ensure non-blocking start
- [x] 2.5 Verify that both players enter the game simultaneously and with the same config
