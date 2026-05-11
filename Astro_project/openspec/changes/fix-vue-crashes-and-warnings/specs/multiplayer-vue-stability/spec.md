## ADDED Requirements

### Requirement: Robust Store Access in Game Components
All multiplayer game components SHALL access `multiplayerStore.room` using optional chaining or guard clauses to prevent `TypeError: cannot read property 'X' of null` when the room state is not yet synchronized.

#### Scenario: Safe access to room config
- **WHEN** a component attempts to read `multiplayerStore.room.gameConfig` before the room is fully loaded
- **THEN** it SHALL NOT throw an error and SHOULD return `undefined` or a default value.

### Requirement: Complete Vue Imports
The `<script setup>` block of every game component MUST import all utilized Vue primitives (e.g., `ref`, `computed`, `watch`, `onMounted`) from the 'vue' package.

#### Scenario: Missing imports detection
- **WHEN** a component uses `ref()` or `onMounted()`
- **THEN** it SHALL have an explicit `import { ref, onMounted, ... } from 'vue'` statement.

### Requirement: Valid Prop Values for UI Components
The system SHALL ensure that all props passed to Vuetify components (like `v-card`) use valid values according to their respective API specifications to avoid console warnings.

#### Scenario: Invalid variant prop
- **WHEN** a `v-card` is rendered in `MultiplayerLobby.vue`
- **THEN** its `variant` prop SHALL be one of: 'elevated', 'flat', 'tonal', 'outlined', 'plain', or 'text'.

### Requirement: Safe Slot Invocation
The system SHALL avoid invoking slots outside of the render function or reactive lifecycle hooks to prevent "Slot invoked outside of the render function" warnings.

#### Scenario: Render-time slot invocation
- **WHEN** a transition or menu uses a default slot
- **THEN** it SHALL be defined and invoked within the template or a functional component's render scope.
