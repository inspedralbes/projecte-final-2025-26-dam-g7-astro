## Context

The project is an Astro-based application with a Vue frontend and a Node.js/Socket.io backend. This change focuses entirely on the frontend implementation of cooperative mechanics for three game modes: SpelledRosco, Radio Signal, and RhymeSquad. Currently, these modes have basic or incomplete cooperative features, leading to potential cheating or lack of engagement.

## Goals / Non-Goals

**Goals:**
- Implement a robust anti-cheat validation system for SpelledRosco hints.
- Enhance communication between cooperative partners in Radio Signal.
- Introduce role-based gameplay and synchronization in RhymeSquad.
- Ensure all changes are visual and logic updates within the Vue components and stores.

**Non-Goals:**
- Modifying the backend logic (unless existing socket events are already available).
- Changing single-player modes.
- Implementing a persistent chat history beyond the current session.

## Decisions

### 1. SpelledRosco Anti-Cheat Validation
- **Decision**: Create a dedicated validation function that uses dynamic RegEx generation.
- **Rationale**: A static list of forbidden words is insufficient. Dynamic RegEx like `s.{0,2}o.{0,2}l` allows catching common obfuscation techniques (S.O.L, S-O-L, S O L).
- **Alternatives**: Using a third-party library for similarity checking, but this might be overkill and less precise for this specific "gap-filling" cheating.

### 2. Multi-Role Synchronization in RhymeSquad
- **Decision**: Leverage the existing `multiplayerStore` to broadcast Sniper actions (cursor movement and clicks).
- **Rationale**: The store already manages shared state. Adding `remoteCursor` and `destroyWord` events is the most idiomatic way to handle real-time synchronization in this project.
- **Alternatives**: Direct socket communication, but this bypasses the store and makes state management harder.

### 3. Word Type Derivation
- **Decision**: Use suffix-based logic within the SpelledRosco component or a utility.
- **Rationale**: Simple suffixes like "-ar", "-er", "-ir" are reliable indicators for verbs in Spanish, which is the likely language.
- **Alternatives**: A full dictionary API, but it introduces dependency on an external service and latency.

## Risks / Trade-offs

- **[Risk]** RegEx might be too aggressive or not aggressive enough. → **Mitigation**: Limit the gap to 0-2 characters and normalize text before check.
- **[Risk]** High latency in remote cursor tracking. → **Mitigation**: Throttle mouse move events before broadcasting to the store.
- **[Risk]** Synchronized destruction might fail if one client has a lag spike. → **Mitigation**: Ensure the event removes the word by ID from the shared array in the store.
