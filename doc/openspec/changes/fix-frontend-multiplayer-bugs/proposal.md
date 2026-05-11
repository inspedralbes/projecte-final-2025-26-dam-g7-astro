## Why

Existen varios errores visuales y de mecánicas en el frontend de los minijuegos multijugador que afectan la experiencia del usuario. Estos errores incluyen palabras invisibles, bloqueos por cooldown excesivos y falta de paridad visual entre el modo un jugador y el modo multijugador.

## What Changes

- **SpelledRosco**: Corrección de la reactividad para asegurar que la palabra a describir sea visible para el 'sender'.
- **RadioSignal**: Reducción o eliminación del cooldown del botón de audio para mejorar la fluidez del juego.
- **RadarScan**: 
    - Restauración del efecto visual de linterna del modo un jugador.
    - Soporte para múltiples linternas simultáneas (locales y remotas).
    - Sincronización de clics en letras entre jugadores.
    - Generación de letras señuelo adicionales en modo multijugador.

## Capabilities

### New Capabilities
- `frontend-multiplayer-fix`: Agrupa las correcciones de errores visuales y de mecánicas en los juegos SpelledRosco, RadioSignal y RadarScan.

### Modified Capabilities
- Ninguna.

## Impact

- `frontend/web/src/components/games/SpelledRosco.vue`
- `frontend/web/src/components/games/RadioSignal.vue`
- `frontend/web/src/components/games/RadarScan.vue`
- `frontend/web/src/stores/multiplayerStore.js`
