## 1. Backend: Implementación de lógica de rondas en RoomManager.js

- [x] 1.1 Definir el método `startRoundTimer(roomId)` para gestionar el tiempo límite de cada juego.
- [x] 1.2 Definir el método `handlePlayerFinished(roomId, user)` para registrar la finalización de los jugadores.
- [x] 1.3 Definir el método `finishRound(roomId)` para calcular resultados y transicionar de estado.
- [x] 1.4 Mejorar el bloque `catch` en `setRoomStatus` para registrar errores detallados y evitar bloqueos silenciosos.

## 2. Frontend: Verificación de transiciones

- [x] 2.1 Confirmar que `MultiplayerLobby.vue` maneja correctamente el cambio a 'PLAYING' sin efectos secundarios reactivos.

## 3. Pruebas y Validación

- [x] 3.1 Crear un script de prueba o test unitario para verificar el ciclo de vida de una ronda (LOBBY -> ROULETTE -> PLAYING -> ROUND_RESULTS).
- [x] 3.2 Validar que la sala no aborta al inicio de juegos no pares como 'SymmetryBreaker'.
