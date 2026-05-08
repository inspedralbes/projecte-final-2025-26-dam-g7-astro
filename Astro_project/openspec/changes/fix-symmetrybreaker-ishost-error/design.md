## Context

During recent changes to implement synchronized starts and cleanup `SymmetryBreaker.vue`, the `isHost` variable was utilized in the logic but its definition was missing from the `script setup` block.

## Goals / Non-Goals

**Goals:**
- Fix the `ReferenceError` in `SymmetryBreaker.vue`.
- Audit other minigames for the same error.

**Non-Goals:**
- Extensive refactoring of the minigames.

## Decisions

### 1. Define `isHost` in `SymmetryBreaker.vue`
We will add `const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)` to the component. We will also ensure `computed` is imported from `vue`.

### 2. Audit and Fix other components
We will use `grep` to find usages of `isHost` and verify if they are defined in:
- `RadarScan.vue`
- `RadioSignal.vue`
- `RhymeSquad.vue`
- `SpelledRosco.vue`
- `WordConstruction.vue`

## Risks / Trade-offs

- **[Risk]** Missing `astroStore` or `multiplayerStore` in some components. → **Mitigation**: Verify imports and store initialization in each file.
