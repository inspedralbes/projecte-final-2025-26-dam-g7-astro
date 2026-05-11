## Context

The current implementation of Syllable Quest focuses on individual syllable counting, which is difficult to coordinate in a fast-paced 2vs2 environment. Word Construction lacks any synchronization, making the "shared" task feel isolated. We need a design that leverages the existing WebSocket infrastructure to provide a unified, real-time cooperative experience.

## Goals / Non-Goals

**Goals:**
- Implement a shared phrase-ordering state for Syllable Quest.
- Implement real-time coordinate synchronization for dragged letters in Word Construction.
- Render remote cursors and drag ghosting to provide high-fidelity feedback of teammate actions.
- Use the Room Host as the authoritative source for initial board shuffling and word selection.

**Non-Goals:**
- Changes to the backend game engine (all logic remains in the Vue frontend).
- Comprehensive anti-cheat for these mechanics (focus is on cooperative playability).
- Persistence of unfinished games across sessions.

## Decisions

- **Syllable Quest (Phrase Ordering)**:
  - The host will select a long phrase and shuffle its words.
  - A `PHRASE_SYNC` action will distribute the shuffled list and the correct sequence to the peer.
  - Clicks are broadcasted via `PHRASE_CLICK`. Both clients maintain a `correctSequenceIndex` and highlight words accordingly.
- **Word Construction (Shared Drag)**:
  - Letters will be assigned unique IDs in the template.
  - On drag start, an `ELEMENT_GRAB` event is sent to notify the peer.
  - During drag, `ELEMENT_MOVE` events are throttled (50ms) to update the letter's `(x, y)` coordinates on the peer's screen.
  - On drop, an `ELEMENT_RELEASE` event finalizes the position and checks for word completion.
- **Visual Feedback**:
  - Use `remoteCursors` from the `multiplayerStore` to show where the teammate is looking/pointing.
  - Add a "teammate dragging" visual state (e.g., semi-transparent or colored glow) to letters being moved by the peer.

## Risks / Trade-offs

- **[Risk] Network Latency during Drag** → **[Mitigation]** Throttling events to 50ms and using CSS transitions for smooth interpolation on the remote side.
- **[Risk] Conflict when both drag same letter** → **[Mitigation]** Implement a simple "lock" mechanism where the first player to start a drag prevents the other from grabbing that specific letter until released.
- **[Risk] Desync in Phrase Order** → **[Mitigation]** The host will be the source of truth for the initial shuffle and word list.
