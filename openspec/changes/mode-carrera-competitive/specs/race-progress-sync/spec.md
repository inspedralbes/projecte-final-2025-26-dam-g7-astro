## ADDED Requirements

### Requirement: Sincronización de Posición
La posición de cada jugador en la secuencia de la carrera debe estar visible para su oponente.

#### Scenario: Actualización de Barra de Progreso
- **WHEN** Un jugador cambia de minijuego (sube su índice de progreso).
- **THEN** Se envía un mensaje por WebSocket y la HUD del oponente actualiza la posición del icono del rival en la barra superior.
