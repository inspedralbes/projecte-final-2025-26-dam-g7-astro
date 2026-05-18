## 1. Backend: Tiempos Individuales y Transferencia

- [x] 1.1 Modificar RoomManager.js para inicializar oom.gameConfig.playerTimes con 150s por jugador en modo 1vs1.
- [x] 1.2 Actualizar startRoundTimer para que decremente los tiempos individuales de los jugadores activos.
- [x] 1.3 Implementar en handleGameAction la lógica: si userA acierta -> playerTimes[userA] += 3 y playerTimes[userB] -= 3.
- [x] 1.4 Asegurar que si un playerTime llega a 0, se dispare el fin de la ronda para ese duelo.

## 2. Backend: Restricción de Equipos 2vs2

- [x] 2.1 Modificar startMatch para validar el tamaño de los equipos.
- [x] 2.2 Si un equipo no tiene exactamente 2 jugadores, devolver error y abortar inicio.

## 3. Frontend: Visualización de Tiempos

- [x] 3.1 Actualizar MultiplayerLobby.vue para mostrar el tiempo individual del jugador y del oponente en lugar del tiempo global de la sala cuando existan playerTimes.
