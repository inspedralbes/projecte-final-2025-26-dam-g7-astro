## 1. Z-Index and CSS Fixes

- [x] 1.1 Update `.letter-tile.dragging` and related classes in `WordConstruction.vue` to have `z-index: 9999`
- [x] 1.2 Ensure any "ghost" or placeholder tiles also use a high z-index

## 2. Drop Zone and Snap Logic

- [x] 2.1 Debug and fix collision detection between tiles and slots in `WordConstruction.vue`
- [x] 2.2 Ensure the `slots` array is correctly updated and synchronized when a letter is placed
- [x] 2.3 Verify that progress (points/levels) is correctly updated after snapping

## 3. Relative Cursor Synchronization

- [x] 3.1 Modify `onMouseMove` to calculate `xPercent` and `yPercent` using `boardRef.getBoundingClientRect()`
- [x] 3.2 Update `multiplayerStore.sendGameAction` to send percentage coordinates
- [x] 3.3 Update remote cursor rendering logic to use percentage-based styles (e.g., `left: x%`, `top: y%`)
- [x] 3.4 Verify cursor alignment on different screen sizes
