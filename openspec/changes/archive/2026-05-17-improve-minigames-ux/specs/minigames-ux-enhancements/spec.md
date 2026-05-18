## ADDED Requirements

### Requirement: Clear and Readable RhymeSquad Turbo Mode
The RhymeSquad game SHALL ensure falling word bubbles remain stable and legible at all times, including during turbo mode. It SHALL NOT shake, jitter, or wobble the text. The falling bubbles SHALL drop through a tall vertical column layout with ample vertical margins to ensure maximum reaction time.

#### Scenario: Stable Turbo Mode Styling
- **WHEN** the player achieves a 10-combo and activates turbo mode
- **THEN** the word bubbles apply a bright, high-visibility styling but remain stable and do not apply any jitter or shake animations.

#### Scenario: Vertical Falling spacing
- **WHEN** words are spawned and fall during RhymeSquad
- **THEN** they drop in a tall, compact vertical layout with a minimum spacing of 80px between words, ensuring ample reading time.

### Requirement: Vintage Retro Controls for RadioSignal
The RadioSignal game SHALL incorporate additional vintage retro control widgets on the dashboard, including a rotating Volume Dial, an AM/FM Band toggle switch, and a Signal Filter static reducer toggle to enhance retro-hacker immersion.

#### Scenario: Rotating Volume Knob
- **WHEN** the user interacts with the Volume Dial knob
- **THEN** the knob rotates visually and adjusts the audio and static feedback volume.

#### Scenario: Vintage Band and Filter Switches
- **WHEN** the user toggles the AM/FM Band switch or the Signal Filter toggle
- **THEN** the dashboard switch updates its state and provides visual retro indicators.

### Requirement: Neon Glowing Boundaries in RadarScan
The RadarScan game SHALL display a sleek, highly visible neon-blue glowing perimeter outline around the letter cell board to clearly define the grid search limits.

#### Scenario: Perimeter Border Display
- **WHEN** the RadarScan game is initialized and active
- **THEN** the center square cell board is surrounded by a sleek, neon-blue glowing boundary that outlines the active grid area.
