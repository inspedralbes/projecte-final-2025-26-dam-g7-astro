## 1. Fix SymmetryBreaker.vue

- [x] 1.1 Add `const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)` to `SymmetryBreaker.vue`
- [x] 1.2 Verify `computed` is imported in `SymmetryBreaker.vue`
- [x] 1.3 Verify `astroStore` and `multiplayerStore` are correctly initialized

## 2. Audit Other Minigames

- [x] 2.1 Check `RadarScan.vue` for `isHost` usage and definition (Verified present)
- [x] 2.2 Check `RadioSignal.vue` for `isHost` usage and definition (Not used, uses subRole)
- [x] 2.3 Check `RhymeSquad.vue` for `isHost` usage and definition (Used locally, correct)
- [x] 2.4 Check `SpelledRosco.vue` for `isHost` usage and definition (Not used, uses subRole)
- [x] 2.5 Check `WordConstruction.vue` for `isHost` usage and definition (Verified present)
- [x] 2.6 Fix any identified missing definitions (Fixed SymmetryBreaker.vue)
