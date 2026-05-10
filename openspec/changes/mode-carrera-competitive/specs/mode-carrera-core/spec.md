## ADDED Requirements

### Requirement: Secuencia de Minijuegos
El modo carrera debe consistir en una lista ordenada de minijuegos que el jugador debe completar secuencialmente.

#### Scenario: Transición de Juego
- **WHEN** El jugador completa el minijuego actual exitosamente.
- **THEN** Se muestra una pantalla de transición breve y se carga el siguiente minijuego de la lista.

### Requirement: Condición de Victoria
El primer jugador en completar todos los minijuegos de la secuencia es declarado ganador.

#### Scenario: Ganar la Carrera
- **WHEN** Un jugador completa el último juego de la lista.
- **THEN** El juego se detiene para ese jugador y se envía un evento de finalización al rival.
