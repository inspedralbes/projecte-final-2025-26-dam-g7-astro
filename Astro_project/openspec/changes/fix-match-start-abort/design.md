## Context

Actualmente, el inicio de una partida multijugador falla después de la fase de ruleta. El backend intenta cambiar el estado de la sala a 'PLAYING', pero se produce un error crítico porque se invocan métodos que no existen en `RoomManager.js`: `startRoundTimer` y `handlePlayerFinished`. Esto provoca que el bloque `catch` revierta el estado a 'LOBBY', interrumpiendo el flujo de juego.

## Goals / Non-Goals

**Goals:**
- Implementar la lógica de temporizador de ronda en el backend.
- Implementar la gestión de finalización de ronda por parte de los jugadores.
- Asegurar una transición fluida entre estados (PLAYING -> ROUND_RESULTS -> ROULETTE/GAME_OVER).

**Non-Goals:**
- No se rediseñará el sistema de comunicación por WebSockets.
- No se añadirán nuevos minijuegos en esta fase.

## Decisions

- **Implementar `startRoundTimer(roomId)`**: Creará un temporizador (usando `setTimeout`) que finalizará la ronda automáticamente tras un tiempo predefinido (ej. 60s) si los jugadores no terminan antes. Se almacenará en `this.roundTimers`.
- **Implementar `handlePlayerFinished(roomId, user)`**: Registrará qué jugadores han completado el minijuego. Cuando todos hayan terminado, se cancelará el temporizador y se llamará a `finishRound`.
- **Implementar `finishRound(roomId)`**: Calculará el ganador de la ronda basándose en las puntuaciones enviadas, actualizará las puntuaciones globales de la sala y cambiará el estado a `ROUND_RESULTS`.
- **Manejo de Errores**: Se mejorará el log de errores en `setRoomStatus` para facilitar la depuración futura.

## Risks / Trade-offs

- **[Riesgo] Condición de carrera**: Varios jugadores terminando casi simultáneamente.
  - **[Mitigación]**: Uso de un `Set` para `roundFinishedPlayers` y verificación atómica de si el tamaño coincide con el número de jugadores antes de proceder.
- **[Riesgo] Jugadores desconectados**: Si un jugador se va, la ronda podría no terminar nunca si esperamos a todos.
  - **[Mitigación]**: El temporizador de seguridad de `startRoundTimer` garantiza que la ronda termine. Además, `leaveRoom` ya limpia referencias.
