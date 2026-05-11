## 1. Shared Infrastructure

- [x] 1.1 Create or update `RemoteCursor.vue` component to support teammate visualization
- [x] 1.2 Implement a throttling utility for high-frequency state synchronization (cursors, dragging)
- [x] 1.3 Ensure `multiplayerStore` correctly handles and exposes `remoteCursors` and `sendGameAction`

## 2. Syllable Quest Redesign (Word Reordering)

- [x] 2.1 Refactor `SyllableQuest.vue` to support "Word Reordering" mode in multiplayer
- [x] 2.2 Implement host-side deterministic shuffling and sequence synchronization
- [x] 2.3 Implement synchronized click handling for word buttons
- [x] 2.4 Add sequence validation logic and reset mechanism for both players on error

## 3. Symmetry Breaker (Double Laser)

- [x] 3.1 Integrate `RemoteCursor` component into `SymmetryBreaker.vue`
- [x] 3.2 Update capture logic to check distance for BOTH local and remote cursors
- [x] 3.3 Add visual feedback for "Coop Capture" (e.g., laser color change when both are on target)
- [x] 3.4 Ensure capture progress stops if either cursor leaves the target radius

## 4. Word Construction (Shared Board 2vs2)

- [x] 4.1 Refactor `WordConstruction.vue` to initialize a shared board state for teammates
- [x] 4.2 Implement throttled `LETTER_MOVE` network events for real-time drag synchronization
- [x] 4.3 Implement "Locking" mechanism so a letter cannot be dragged by two players at once
- [x] 4.4 Integrate `RemoteCursor` to show teammate activity on the board
