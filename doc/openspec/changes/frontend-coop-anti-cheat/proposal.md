## Why

The current implementation of cooperative modes needs more robust mechanics to enhance the user experience and ensure fair play. Specifically, the SpelledRosco mode lacks anti-cheating measures, while Radio Signal and RhymeSquad require better communication and role-based cooperation to be truly engaging.

## What Changes

- **SpelledRosco Anti-Cheat**: Replacing the emoji-based hint system with a text input that includes advanced validation to prevent players from sending the exact word or obfuscated versions of it.
- **SpelledRosco Hints**: Providing the "guesser" with additional information (category and word type) to compensate for the more restrictive hint system.
- **Radio Signal Communication**: Removing restrictions on audio signals and adding a text-based mini-chat to facilitate coordination.
- **RhymeSquad 2vs2 Roles**: Introducing specialized "Catcher" and "Sniper" roles with synchronized actions and shared visual feedback (remote cursors).

## Capabilities

### New Capabilities
- `spelled-rosco-anti-cheat`: Advanced text validation using dynamic RegEx to detect and block cheating attempts in hints.
- `spelled-rosco-hints`: Display of linguistic metadata (category, suffix-derived word type) to the guesser.
- `radio-signal-coop-enhancements`: Real-time text communication and unlimited audio signaling for cooperative pairs.
- `rhymesquad-2vs2-roles`: Cooperative gameplay roles with synchronized word destruction and remote cursor tracking.

### Modified Capabilities
<!-- No existing specs found in openspec/specs -->

## Impact

- **Frontend (Vue)**: Modification of game components (`SpelledRosco.vue`, `RadioSignal.vue`, `RhymeSquad.vue`).
- **State Management**: Updates to `multiplayerStore` to handle new events and chat messages.
- **User Interface**: New UI elements for hints, anti-cheat feedback, and the mini-chat.
