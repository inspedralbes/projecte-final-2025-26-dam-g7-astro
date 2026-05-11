## 1. Investigation & Diagnosis

- [x] 1.1 Analyze `MultiplayerLobby.vue` reactivity with guest credentials
- [x] 1.2 Confirm that `multiplayerStore.room` updates trigger the status watcher on all clients

## 2. Core Implementation

- [x] 2.1 Refactor `status` watcher in `MultiplayerLobby.vue` to use `{ immediate: true }`
- [x] 2.2 Add explicit state check in `onMounted` of `MultiplayerLobby.vue` to initialize the view
- [x] 2.3 Ensure `activeGameComponent` is correctly resolved even if the `ROULETTE` phase is skipped or shortened
- [x] 2.4 Verify that `RouletteOverlay` is properly unmounted when `showRoulette` becomes false

## 3. Verification

- [x] 3.1 Test match start with 2+ players and verify all enter the game simultaneously
- [x] 3.2 Simulate late-join scenario to ensure player enters the correct active state (roulette or game)
