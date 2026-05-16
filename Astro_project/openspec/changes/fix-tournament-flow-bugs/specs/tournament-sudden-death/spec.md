## ADDED Requirements

### Requirement: Activación de Muerte Súbita
El sistema DEBE detectar empates al agotarse el tiempo y extender la partida hasta el próximo acierto.

#### Scenario: Empate detectado
- **WHEN** el temporizador llega a 0 y la puntuación de P1 es igual a la de P2.
- **THEN** el servidor cambia el estado de la sala a `SUDDEN_DEATH`, detiene el tiempo y mantiene habilitado el minijuego.

### Requirement: Ganador Instantáneo en Muerte Súbita
El primer jugador en conseguir un punto durante la muerte súbita debe ser declarado ganador del combate.

#### Scenario: Primer acierto gana
- **WHEN** la sala está en `SUDDEN_DEATH` y P1 envía un evento de acierto.
- **THEN** el servidor declara a P1 ganador inmediatamente y termina el combate.
