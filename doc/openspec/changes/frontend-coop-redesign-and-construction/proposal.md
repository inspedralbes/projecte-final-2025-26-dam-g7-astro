## Why

The current cooperative mechanics for Syllable Quest (syllable counting) and Word Construction (drag-and-drop) do not provide a sufficiently coordinated 2vs2 experience. Redesigning Syllable Quest into a phrase-ordering game and implementing a shared, synchronized board for Word Construction will significantly improve team collaboration and engagement.

## What Changes

- **Syllable Quest Redesign**:
  - **BREAKING**: The syllable counting mechanic is completely removed in multiplayer mode.
  - New "Ordering Phrases" mechanic: Players must click jumbled words in the correct order to reconstruct a long phrase.
  - Shared progress: Both players see the same jumbled words and their clicks contribute to a single shared sequence.
- **Word Construction Shared Board**:
  - Shared Board: Both players in a 2vs2 team see exactly the same layout of letters.
  - Real-time Synchronization: Letter positions are updated in real-time as they are dragged by either player.
  - Remote Visualization: The teammate's `remoteCursor` is visible to facilitate coordination.
  - Collaborative Completion: Both players can interact with the board simultaneously to form the target word.

## Capabilities

### New Capabilities
- `phrase-ordering-coop`: Logic for collaborative phrase reconstruction from jumbled words.
- `shared-drag-and-drop-board`: Infrastructure for a board where multiple users can drag and drop elements with real-time state synchronization.
- `collaborative-word-formation`: Logic for multiple players contributing to a single word construction goal on a shared board.

### Modified Capabilities
- `multiplayer-sync`: Extend synchronization payloads to handle phrase ordering clicks and real-time drag coordinates.

## Impact

- `frontend/web/src/components/games/SyllableQuest.vue`: Complete redesign of the template and logic for multiplayer.
- `frontend/web/src/components/games/WordConstruction.vue`: Update to support shared state, drag synchronization, and remote cursor rendering.
- `frontend/web/src/stores/multiplayerStore.js`: Verification of support for higher-frequency 'MOUSE_MOVE' or 'ELEMENT_DRAG' actions.
