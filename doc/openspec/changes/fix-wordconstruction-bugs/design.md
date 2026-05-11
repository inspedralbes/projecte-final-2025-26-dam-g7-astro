## Context

The `WordConstruction.vue` component relies on drag-and-drop mechanics which are currently failing to synchronize and validate correctly in a multiplayer environment.

## Goals / Non-Goals

**Goals:**
- Ensure dragged letters are always visible on top of other elements.
- Fix the snapping logic so letters can be placed in slots.
- Align remote cursors accurately across different client resolutions.

## Decisions

### 1. Z-Index Management
Apply `.drag-active` or similar classes with `z-index: 9999` to elements being moved.

### 2. Relative Coordinates for Cursors
Instead of sending `mouseX` and `mouseY` as pixels, we will send them as percentages of the `boardRef` container.
- `xPercent = (mouseX / boardWidth) * 100`
- `yPercent = (mouseY / boardHeight) * 100`

### 3. Drop Zone Snap Fix
Verify the collision detection between the dragged tile and the slot positions. Ensure that once a tile is within a threshold of a slot, it is "locked" and the state is synchronized.

## Risks / Trade-offs

- **[Risk]** Container resizing during the game. → **Mitigation**: Percentages handle resizing better than pixels, but we should still ensure `getBoundingClientRect()` is called when needed.
