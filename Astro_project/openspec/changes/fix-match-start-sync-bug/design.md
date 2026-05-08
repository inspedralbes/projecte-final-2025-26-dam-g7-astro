## Context

In the current implementation of `MultiplayerLobby.vue`, the transition from the lobby/roulette to the active game depends on a non-immediate watcher on `multiplayerStore.room.status`. If the state change happens before the watcher is initialized or if the component is mounted with an already active state (e.g., `PLAYING`), the guest player remains in the lobby view.

## Goals / Non-Goals

**Goals:**
- Ensure Host and Guest transition to the mini-game simultaneously.
- Fix the issue where guests are stuck in the lobby or roulette.
- Make the reactive logic robust against race conditions and late joins.

**Non-Goals:**
- Refactoring the server-side state machine.
- Changing the visual design of the roulette or lobby.

## Decisions

### 1. Immediate Watcher for Room Status
- **Decision**: Add `{ immediate: true }` to the `multiplayerStore.room?.status` watcher.
- **Rationale**: This ensures that even if the room is already in `ROULETTE` or `PLAYING` state when the component is mounted, the corresponding logic (showing roulette or setting the active game component) executes immediately.

### 2. Centralized View Management
- **Decision**: Consolidate the view state logic into a single function that can be called both by the watcher and during initialization.
- **Rationale**: Reduces code duplication and ensures consistency between "live" updates and "initial" state.

### 3. Safety Check for Game Component Resolution
- **Decision**: Add a fallback check to ensure that if the status is `PLAYING`, `activeGameComponent` is resolved immediately from the `gameConfig.currentGame` in the store.
- **Rationale**: Prevents the guest from being stuck if the `PLAYING` status arrives without a discrete `ROULETTE` phase or if the messages are processed out of order.

## Risks / Trade-offs

- **[Risk] Double Execution** → Mitigation: Ensure the initialization logic and watcher logic don't conflict (Vue 3's `immediate` watcher handles the first call automatically).
- **[Risk] Premature Component Mount** → Mitigation: Use `shallowRef` and `v-if` to ensure components are only mounted when valid game data is available.
