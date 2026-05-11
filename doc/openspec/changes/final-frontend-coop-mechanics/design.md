## Context

The project already uses a `multiplayerStore` with Socket.io for real-time communication. Basic cursor tracking and game action broadcasting are implemented but need to be leveraged for more complex cooperative mechanics where the state of the game depends on the simultaneous actions of both players.

## Goals / Non-Goals

**Goals:**
- Implement real-time synchronization for three mini-games.
- Ensure both players see the same game state (shuffled order, letter positions).
- Visual feedback for teammate presence (remote cursors).
- Logic that mandates cooperation (double cursor capture).

**Non-Goals:**
- Backend refactoring (all logic should be frontend-driven via existing message passing).
- Modification of single-player modes.

## Decisions

### 1. Deterministic Shuffle for Syllable Quest
- **Decision**: The room host (or the first player in the `players` array) will generate the shuffled sequence and emit a `GAME_INIT` action with the sequence.
- **Rationale**: Ensures both players see the exact same "chaos" without needing complex seed management.
- **Alternatives**: Using a shared seed based on room ID. Rejected as explicit state sync is more robust for dynamic content.

### 2. Remote Cursor Rendering & Proximity Logic
- **Decision**: Create a reusable `RemoteCursor` component. In `SymmetryBreaker.vue`, the `update` loop will check the distance between the target and both `localCursor` and `remoteCursors[teammateId]`.
- **Rationale**: Centralizing cursor rendering allows for consistent visual feedback across all cooperative games.
- **Alternatives**: Hardcoding cursor drawing in each game. Rejected for poor maintainability.

### 3. Throttled Drag & Drop Sync for Word Construction
- **Decision**: Emit `LETTER_MOVE` actions during drag events, throttled to ~30ms (approx. 30fps).
- **Rationale**: Real-time sync is requested, but unthrottled emissions would flood the network and cause lag.
- **Alternatives**: Syncing only on `dragEnd`. Rejected as it doesn't fulfill the "real-time" requirement.

## Risks / Trade-offs

- **[Risk] Network Latency in Symmetry Breaker** → Mitigation: Use a slightly larger "collision" radius for the remote cursor to account for lag, ensuring the game doesn't feel unfair.
- **[Risk] Race Conditions in Word Construction** → Mitigation: Implement a simple "ownership" flag where a letter being dragged by one player cannot be interacted with by the other until `dragEnd`.
- **[Risk] Desynchronization in Syllable Quest** → Mitigation: The sequence of clicked words should be validated against the shared master sequence; if an out-of-order click occurs, it resets for both.
