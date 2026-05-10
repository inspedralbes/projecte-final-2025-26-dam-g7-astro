## ADDED Requirements

### Requirement: Consumo de Combustible
El combustible cuántico debe disminuir automáticamente con el paso del tiempo.

#### Scenario: Agotamiento de Combustible
- **WHEN** El nivel de combustible llega a 0.
- **THEN** El juego termina inmediatamente con un estado de "Game Over".

### Requirement: Recarga de Combustible
El combustible debe aumentar cada vez que el jugador supere un minijuego de forma rápida y correcta.

#### Scenario: Bonus por Completitud
- **WHEN** El minijuego se marca como completado.
- **THEN** Se añade un % de combustible (ej. +20%) hasta un máximo del 100%.
