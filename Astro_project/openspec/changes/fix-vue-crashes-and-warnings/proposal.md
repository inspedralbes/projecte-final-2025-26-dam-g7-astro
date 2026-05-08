## Why

The multiplayer game experience is currently degraded by critical Vue crashes in the `RhymeSquad.vue` component and recurring console warnings in `MultiplayerLobby.vue`. These issues prevent matches from starting correctly and cause UI corruption, leading to a poor user experience and instability during synchronized game starts.

## What Changes

- **RhymeSquad.vue Stability**: 
    - Fix potential `ReferenceError` and `TypeError` by ensuring all required Vue primitives (ref, computed, onMounted, etc.) are imported.
    - Implement safe access patterns for `multiplayerStore.room` using optional chaining.
    - Audit variables for proper definitions in the `<script setup>` block.
- **UI Warning Resolution**: 
    - Fix `Invalid prop: custom validator check failed for prop "variant"` in `MultiplayerLobby.vue` (likely on `v-card` components).
    - Address `Slot "default" invoked outside of the render function` warnings in menus and transitions to prevent UI glitches.
- **Audit and Sanitization**: Perform a brief audit of recent multiplayer component changes to ensure consistent coding patterns.

## Capabilities

### New Capabilities
- `multiplayer-vue-stability`: Ensures that all multiplayer game components follow best practices for Vue 3 reactivity and store access, minimizing runtime crashes.

### Modified Capabilities
<!-- None -->

## Impact

- `frontend/web/src/components/games/RhymeSquad.vue`
- `frontend/web/src/pages/friends/MultiplayerLobby.vue`
- General frontend UI stability and developer console cleanliness.
