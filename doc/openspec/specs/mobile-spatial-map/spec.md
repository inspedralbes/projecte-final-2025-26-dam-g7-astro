# mobile-spatial-map Specification

## Purpose
Interactive vertical progress map with node navigation and phase visualizers.

## Requirements
### Requirement: Interactive Training Map
The mobile application SHALL feature a vertical, scrollable training map that visualizes the user's progress through different levels and phases, mirroring the desktop sequence.

#### Scenario: User views the map
- **WHEN** the user navigates to the "Training" tab
- **THEN** they see a vertical path with level nodes, where completed levels are marked with a check, the current level is highlighted, and future levels are locked.

### Requirement: Node Interaction and Game Launch
The system SHALL allow users to interact with accessible map nodes to view level details and launch the associated minigame.

#### Scenario: User launches a level
- **WHEN** the user taps an unlocked level node and then the "Start" button in the preview
- **THEN** the map view is replaced by the corresponding minigame component.

### Requirement: Dynamic Level Synchronization
The map SHALL automatically update the state of nodes (locked/unlocked/completed) based on the user's progress data fetched from the backend.

#### Scenario: User completes a level
- **WHEN** the user successfully completes a level with a score above the minimum required
- **THEN** the map node state transitions to "completed" and the next node in the sequence transitions to "current".
