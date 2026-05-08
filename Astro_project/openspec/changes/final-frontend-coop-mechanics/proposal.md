## Why

The current multiplayer implementation of certain mini-games lacks deep cooperative mechanics that require simultaneous action and tight coordination. This change aims to finalize the frontend cooperative logic for Syllable Quest, Symmetry Breaker, and Word Construction to deliver a truly collaborative 2vs2 experience.

## What Changes

- **Syllable Quest (Word Reordering Redesign)**:
  - In multiplayer, the game shifts from syllable counting to sentence reconstruction.
  - A long sentence is split into shuffled words displayed as buttons.
  - Both players see the same randomized order and must click words in the correct sequence.
  - Clicks are synchronized in real-time using `multiplayerStore.sendGameAction`.
- **Symmetry Breaker (Double Laser)**:
  - Cooperative target capture mechanism: progress only occurs when BOTH the local and remote teammate's cursors are positioned over the target at the same time.
  - Visual representation of the teammate's cursor using `multiplayerStore.remoteCursors`.
- **Word Construction (Shared Board)**:
  - Adapted for 2vs2 play with a shared board of shuffled letters.
  - Real-time synchronization of letter positions during drag & drop.
  - Display of the teammate's `remoteCursor` to facilitate coordination while forming words.

## Capabilities

### New Capabilities
- `syllable-quest-coop-reorder`: Collaborative sentence reconstruction with shared state and synchronized actions.
- `symmetry-breaker-coop-laser`: Dual-cursor requirement for target interaction and remote cursor visualization.
- `word-construction-2vs2-sync`: Real-time shared board state and synchronized drag & drop for team play.

### Modified Capabilities
- `multiplayer-game-sync`: Enhanced synchronization patterns for high-frequency updates (cursors and drag & drop) and discrete actions (word clicks).

## Impact

- `frontend/web/src/components/games/SyllableQuest.vue`: Complete redesign of the multiplayer game loop and UI for word reordering.
- `frontend/web/src/components/games/SymmetryBreaker.vue`: Addition of remote cursor tracking and dual-occupancy logic for target capture.
- `frontend/web/src/components/games/WordConstruction.vue`: Implementation of shared board state synchronization and drag & drop network events.
- `frontend/web/src/stores/multiplayerStore.js`: Verification and potential enhancement of cursor and game action handling for low-latency synchronization.
