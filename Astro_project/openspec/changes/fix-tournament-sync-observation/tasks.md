## 1. Backend: Sincronización y Broadcast (Node.js)

- [x] 1.1 Asegurar que `RoomManager.js` asigne `PLAYING` como estado de sala justo antes de emitir `MATCH_STARTING`.
- [x] 1.2 Refactorizar `broadcastToRoom` para asegurar que el mensaje llegue a TODOS los participantes, incluyendo observadores.
- [x] 1.3 Implementar el reenvío de todas las `GAME_ACTION` (BOARD_SYNC, TIME_SYNC, etc.) a los espectadores no participantes en `RoomManager.js`.

## 2. Frontend: Renderizado Espectador (Vue.js)

- [x] 2.1 Actualizar `MultiplayerLobby.vue` para forzar `isTransitioning = false` al recibir `MATCH_STARTING`.
- [x] 2.2 Implementar en `WordConstruction.vue` la lógica de escucha para `SPECTATOR_SYNC` y otros eventos cuando `props.isSpectator` es true.
- [x] 2.3 Asegurar que las variables de estado (score, level, letters, hint) se actualicen en el componente de juego cuando el mensaje provenga del jugador observado.

## 3. Verificación y Pruebas

- [x] 3.1 Probar una partida de torneo con un tercer observador para confirmar que ve las letras y el tiempo moviéndose.
- [x] 3.2 Confirmar que los jugadores atrapados en "Iniciando..." ahora entran al juego correctamente.
