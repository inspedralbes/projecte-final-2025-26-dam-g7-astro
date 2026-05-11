## Why

The `SymmetryBreaker.vue` component is crashing with a `ReferenceError: isHost is not defined`. This is because the variable `isHost` is used in multiple places in the script setup but has not been defined.

## What Changes

- **Define isHost**: Add the `isHost` computed property to `SymmetryBreaker.vue`.
- **Verify other minigames**: Check `RadarScan.vue`, `RadioSignal.vue`, `RhymeSquad.vue`, `SpelledRosco.vue`, and `WordConstruction.vue` for similar missing definitions.

## Capabilities

### New Capabilities
- `multiplayer-role-detection`: Standardizes how components detect if the local player is the host of the room.

### Modified Capabilities
<!-- None -->

## Impact

- `frontend/web/src/components/games/SymmetryBreaker.vue`
- Possibly other minigame components in `frontend/web/src/components/games/`
