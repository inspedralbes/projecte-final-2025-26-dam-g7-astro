## Why

The `WordConstruction.vue` component has several issues in multiplayer mode:
1.  **Z-Index**: Dragged letters can appear behind other UI elements.
2.  **Drop Zones**: The snap logic for dropping letters into slots is broken, preventing progress.
3.  **Cursor Sync**: Remote cursors are offset due to absolute coordinate usage instead of relative percentages.

## What Changes

- **Z-Index Fix**: Update CSS to ensure dragged/ghost letters have a high z-index (9999).
- **Drop Zone Logic**: Repair the `slots` and snap detection logic to ensure letters are correctly accepted and progress is counted.
- **Relative Cursor Sync**: Refactor `onMouseMove` to calculate and send relative percentage coordinates. Update remote cursor rendering to use these percentages for consistent positioning across different screen sizes.

## Capabilities

### New Capabilities
- `multiplayer-relative-cursor-sync`: A strategy for synchronizing cursors using relative percentages of a shared container.

### Modified Capabilities
<!-- None -->

## Impact

- `frontend/web/src/components/games/WordConstruction.vue`
