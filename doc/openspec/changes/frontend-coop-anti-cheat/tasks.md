## 1. Utilities and Store Updates

- [x] 1.1 Create `frontend/src/utils/hintValidator.js` with normalization and dynamic RegEx logic
- [x] 1.2 Update `frontend/src/stores/multiplayerStore.js` to include state for `remoteCursor`
- [x] 1.3 Update `frontend/src/stores/multiplayerStore.js` to handle `chatMessages` and `wordDestruction` events

## 2. SpelledRosco Implementation

- [x] 2.1 Replace emoji selector with `v-text-field` in `SpelledRosco.vue`
- [x] 2.2 Integrate `hintValidator` into the input submission process
- [x] 2.3 Implement error alerts for detected cheating or exact word matches
- [x] 2.4 Add `v-chip` components for Category and Word Type hints for the guesser
- [x] 2.5 Implement suffix-based word type derivation logic

## 3. Radio Signal Implementation

- [x] 3.1 Remove audio button cooldown in `RadioSignal.vue`
- [x] 3.2 Add a mini-chat UI component using `v-text-field` and a message list
- [x] 3.3 Link the mini-chat to `multiplayerStore` for real-time synchronization

## 4. RhymeSquad Implementation

- [x] 4.1 Define Catcher and Sniper roles and assign them to players
- [x] 4.2 Restrict spaceship movement to the Catcher role
- [x] 4.3 Implement click-to-destroy logic for the Sniper role
- [x] 4.4 Add a `remoteCursor` visual element that tracks the Sniper's position for the Catcher
- [x] 4.5 Synchronize word destruction across clients via `multiplayerStore`

## 5. Testing and Validation

- [x] 5.1 Verify anti-cheat RegEx with various obfuscated inputs (S.O.L, S-O-L, SxOxL)
- [x] 5.2 Test synchronization of remote cursors and word destruction in RhymeSquad
- [x] 5.3 Ensure text chat works bidirectionally in Radio Signal
- [x] 5.4 Confirm that linguistic hints are correctly displayed in SpelledRosco
