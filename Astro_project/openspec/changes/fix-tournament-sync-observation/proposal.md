## Why

Corregir fallos críticos de sincronización en el modo Torneo que impiden el inicio fluido de las partidas (bloqueo en "Iniciando automáticamente") y asegurar que los espectadores puedan observar los duelos en tiempo real, mejorando la experiencia competitiva y social del juego.

## What Changes

- **Sincronización de Inicio**: Refactorización del flujo de inicio de partida en `RoomManager.js` para asegurar que el evento `MATCH_STARTING` y la transición a `PLAYING` se emitan de forma atómica y síncrona a todos los participantes.
- **Observación en Tiempo Real**: Implementación de un sistema de retransmisión de eventos de juego desde el servidor a todos los miembros de la sala que no participan en el duelo activo.
- **Renderizado de Espectador**: Ajustes en el frontend para procesar y aplicar el estado del juego recibido vía WebSocket cuando el componente está en modo `isSpectator`.

## Capabilities

### New Capabilities
- `real-time-spectator-sync`: Capacidad para retransmitir estados de juego (BOARD_SYNC, TIME_SYNC, WORD_SUCCESS, etc.) a observadores no participantes.
- `atomic-match-initialization`: Protocolo de inicio de partida robusto que garantiza que todos los clientes cambien de estado simultáneamente.

### Modified Capabilities
- `boss-mode-ws`: Mejora en la difusión de eventos para incluir a espectadores.

## Impact

- **Backend**: Modificaciones en `backend/src/ws/RoomManager.js` para gestionar el broadcast a no participantes.
- **Frontend**: Actualización de los componentes de juego (como `WordConstruction.vue`) para reaccionar a los mensajes de sincronización en modo espectador.
- **Lobby**: Ajustes en `MultiplayerLobby.vue` para gestionar mejor el estado de transición.
