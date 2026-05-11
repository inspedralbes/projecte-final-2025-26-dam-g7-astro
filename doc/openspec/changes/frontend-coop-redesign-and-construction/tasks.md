## 1. Syllable Quest Redesign (Phrase Ordering)

- [x] 1.1 Update `SyllableQuest.vue` template to display jumbled words as clickable buttons instead of syllable counters.
- [x] 1.2 Implement `PHRASE_SYNC` action where the host shuffles the phrase and broadcasts the shared state to the team.
- [x] 1.3 Implement `PHRASE_CLICK` synchronization to track shared progress through the word sequence.
- [x] 1.4 Add visual indicators (highlights/animations) for words correctly placed in the sequence by any teammate.
- [x] 1.5 Implement penalty logic (reset progress/time reduction) for out-of-order clicks in multiplayer.

## 2. Word Construction (Shared Drag & Drop)

- [x] 2.1 Update `WordConstruction.vue` to ensure unique ID assignment for each letter element.
- [x] 2.2 Implement `BOARD_SYNC` for Word Construction to synchronize initial letter positions between teammates.
- [x] 2.3 Implement throttled `ELEMENT_MOVE` (50ms) events to sync letter coordinates in real-time during a drag.
- [x] 2.4 Implement `ELEMENT_GRAB` and `ELEMENT_RELEASE` to manage drag locking and ownership.
- [x] 2.5 Render `remoteCursors` on the board to visualize teammate movements.
- [x] 2.6 Add visual cues (e.g., glow or transparency) to letters being dragged by the teammate.

## 3. Verification & Final Polish

- [x] 3.1 Test Syllable Quest redesign with 2 players to ensure phrase ordering is perfectly synchronized.
- [x] 3.2 Test Word Construction with 2 players to verify smooth drag synchronization and lack of race conditions.
- [x] 3.3 Ensure single-player mode for both games remains functional and unaffected by these changes.
