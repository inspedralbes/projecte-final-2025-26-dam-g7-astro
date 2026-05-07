## Why

Implementar un modo cooperativo 2vs2 en el minijuego RadarScan para fomentar la colaboración entre jugadores del mismo equipo. Actualmente, el juego es individual; esta mejora introduce mecánicas de equipo que requieren comunicación y coordinación en tiempo real para completar los objetivos.

## What Changes

- **Sincronización de cursores (Linternas)**: Los jugadores del mismo equipo verán la linterna de su compañero en tiempo real.
- **Objetivos divididos**: En modo cooperativo, se generarán dos objetivos distintos por ronda.
- **Validación de clics por jugador**: El Jugador 1 solo podrá recolectar el Objetivo A y el Jugador 2 el Objetivo B.
- **Flujo de ronda cooperativo**: La ronda solo avanzará cuando ambos jugadores hayan recolectado su respectivo objetivo.
- **Comunicación WebSockets**: Retransmisión de eventos de movimiento de ratón entre compañeros de equipo.

## Capabilities

### New Capabilities
- `multiplayer-team-radarscan`: Mecánica principal del modo cooperativo para RadarScan, gestionando el estado de la partida por equipos.
- `team-flashlight-sync`: Sistema de sincronización de la posición del ratón entre jugadores del mismo equipo mediante WebSockets.
- `cooperative-objective-logic`: Lógica de asignación y validación de objetivos cruzados para forzar la cooperación.

### Modified Capabilities
<!-- No hay capacidades existentes registradas en openspec/specs -->

## Impact

- **Backend**: `RoomManager.js` o equivalente para gestionar la retransmisión de eventos `MOUSE_MOVE` a nivel de equipo.
- **Frontend Stores**: `multiplayerStore.js` para manejar el estado de los cursores remotos.
- **Componentes**: `RadarScan.vue` para renderizar múltiples linternas y aplicar la lógica de validación de clics.
