## Why

Users find that RhymeSquad's turbo mode (shaking text/dizzy yellow theme) and narrow falling spacing make it hard to read and react. In addition, the Radio Signal tuning is too difficult with a single knob, and they want more interactive retro controls (like dials and switches). Lastly, RadarScan needs clear perimeter boundaries so that players know where the letters are limited.

## What Changes

- **RhymeSquad**:
  - Remove the jittering/shaking animation and the high-contrast yellow from `.bubble-turbo` to ensure text is clear and readable.
  - Optimize the vertical falling track by styling it as a tall vertical column with generous spacing between words so players have adequate reaction time.
- **RadioSignal**:
  - Add highly interactive vintage radio widgets: a "Volume Dial" knob, an "AM/FM Band" toggle switch, and a "Signal Filter" static reducer switch.
  - Wire these controls to play feedback or toggle visual/audio aesthetics.
- **RadarScan**:
  - Implement a highly visible neon-blue glowing perimeter border around the square letter-cell grid, providing clear visual limits of where letter targets can appear.

## Capabilities

### New Capabilities
- `minigames-ux-enhancements`: Comprehensive visual, accessibility, and interactive enhancements for RhymeSquad, RadioSignal, and RadarScan to optimize readability and immersion.

### Modified Capabilities
<!-- No existing capabilities to modify -->

## Impact

- **Frontend Vue Minigames**:
  - `RhymeSquad.vue`
  - `RadioSignal.vue`
  - `RadarScan.vue`
- **Assets & Styling**: CSS neon rules and interactive controls.
