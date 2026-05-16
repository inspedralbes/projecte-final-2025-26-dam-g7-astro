## 1. Backend: Sincronización y Muerte Súbita

- [x] 1.1 Modificar `RoomManager.js` para incluir `currentGame` en todos los mensajes de estado de sala y `MATCH_STARTING`.
- [x] 1.2 Implementar la detección de empates en el fin de ronda y la transición al estado `SUDDEN_DEATH`.
- [x] 1.3 Ajustar los manejadores de eventos de puntuación para que, en estado `SUDDEN_DEATH`, se declare un ganador inmediatamente.

## 2. Frontend: Componentes Dinámicos y Observación

- [x] 2.1 Refactorizar `MultiplayerLobby.vue` para usar `<component :is="...">` basándose en el `currentGame` enviado por el servidor.
- [x] 2.2 Asegurar que el componente de juego reciba la prop `isSpectator` correctamente y bloquee las interacciones del usuario.
- [x] 2.3 Sincronizar el estado del componente espectador con los mensajes `GAME_ACTION` (score, level, progress) recibidos.

## 3. Automatización del Flujo del Torneo

- [x] 3.1 Implementar la transición automática del estado `MATCH_RESULTS` a `TOURNAMENT_BRACKETS` tras 3 segundos.
- [x] 3.2 Programar el temporizador en el servidor que, tras 7 segundos en `TOURNAMENT_BRACKETS`, lance el siguiente combate disponible.
- [x] 3.3 Asegurar que todos los clientes cambien de vista simultáneamente mediante los eventos emitidos por el servidor.
