## Context

The user is experiencing playability and readability issues in several minigames:
1. **RhymeSquad**: Shaking turbo text and tight word falling spacing create a hectic experience with little time to react.
2. **RadioSignal**: Sintonization dial is difficult to control with the drag knob alone, and the terminal dashboard lacks additional interactive vintage widgets.
3. **RadarScan**: The cell board expands dynamically, and it lacks clear visual perimeter lines defining where the search letters are restricted.

This design covers the frontend Vue modifications to address all three concerns while maintaining production-grade performance and tournament synchronization.

## Goals / Non-Goals

**Goals:**
- Optimize RhymeSquad's turbo style to be stable (non-shaking) and adjust word-fall layout spacing to be highly readable.
- Add highly interactive vintage control widgets (Volume Dial knob, AM/FM toggle switch, Signal Filter toggle) to the RadioSignal dashboard.
- Introduce a glowing neon-cyan border perimeter around the RadarScan square grid cell board.

**Non-Goals:**
- Modifying backend RoomManager or database tournament scoring rules.
- Restructuring core multiplayer socket state propagation.

## Decisions

### Decision 1: Stable Turbo Bubbles in RhymeSquad
- **Approach**: Replace the `.bubble-turbo` CSS class animation from `@keyframes jitter` (which rapidly translates/shakes the element) to a static, high-contrast neon-yellow pulsing glow (`box-shadow: 0 0 20px rgba(255, 234, 0, 0.8)`).
- **Rationale**: Keeps the visual excitement of turbo mode intact without inducing motion sickness or compromising target readability.

### Decision 2: Spaced Vertical Columns in RhymeSquad
- **Approach**: Set a maximum viewport height on the falling words track and increase vertical letter/word bubble margin spacing (`min-height: 80px`).
- **Rationale**: Ensures the falling words are separated evenly, giving players adequate visual processing time.

### Decision 3: Retro Dashboard Toggles in RadioSignal
- **Approach**: Add interactive Volume knob (`<div class="knob-volume">`), Band toggle (`AM/FM`), and a Filter switch inside the Radio Signal HUD layout. Link them to reactive local Vue properties (`radioVolume`, `isFilterActive`, `bandSelected`).
- **Rationale**: Elevates the vintage terminal simulator aesthetics, giving players supplementary interactive retro controls.

### Decision 4: RadarScan Glowing Perimeter
- **Approach**: Add a dedicated `.radar-border` or modify `.board` style in `RadarScan.vue` to render a sleek, neon-cyan border with CSS `border: 2px dashed #00e5ff; box-shadow: 0 0 15px rgba(0, 229, 255, 0.4)` representing a tactical scanner grid scope.
- **Rationale**: Explicitly defines the limits of the search space, so users never search outside the valid cell area.

## Risks / Trade-offs

- **[Risk] Retro Knobs Layout Space** → The RadioSignal panel has tight vertical bounds.
  - *Mitigation*: Render the toggles in a compact sidebar panel or flanking the main frequency knob in a beautiful, symmetric control grid.
