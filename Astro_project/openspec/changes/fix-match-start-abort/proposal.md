## Why

Las partidas fallan al iniciar inmediatamente después de que la ruleta selecciona un juego (ej. RadioSignal o SymmetryBreaker). El frontend recibe el evento 'MATCH_STARTING', pero la sala vuelve al lobby de forma inesperada. Este error impide que los jugadores puedan participar en los minijuegos, afectando la jugabilidad principal.

## What Changes

- **BACKEND**: Corrección en `RoomManager.js` de la lógica de transición al estado 'PLAYING'. Se identificará y reparará la excepción que causa que el bloque `catch` revierta la sala a 'LOBBY'.
- **BACKEND**: Mejora en la inicialización de los datos del juego para manejar correctamente variables indefinidas y la iteración de equipos (`teams`).
- **BACKEND**: Asegurar compatibilidad para juegos que no son de tipo 'isPairGame'.
- **FRONTEND**: Verificación y corrección de posibles bloqueos reactivos en Vue durante la transición del estado 'ROULETTE' a 'PLAYING' para asegurar el montaje del componente del minijuego.

## Capabilities

### New Capabilities
- `match-start-reliability`: El sistema debe asegurar que el inicio de una partida (transición a PLAYING) sea robusto, con temporizadores de seguridad y gestión de finalización de ronda.

### Modified Capabilities
- Ninguna. Los requisitos de alto nivel no cambian, solo se corrige la implementación para que funcione según lo esperado.

## Impact

- **Backend**: `backend/src/ws/RoomManager.js` y posiblemente servicios relacionados con la gestión de partidas.
- **Frontend**: Componentes de gestión de estado de la sala y transiciones de vista de juego.
- **Usuario**: Mejora crítica en la estabilidad del inicio de partidas multijugador.
