## ADDED Requirements

### Requirement: Modo de juego RadarScan Cooperativo
El sistema SHALL permitir iniciar una partida de RadarScan en modo 2vs2 donde los jugadores de un mismo equipo colaboran para encontrar objetivos.

#### Scenario: Inicio de partida cooperativa
- **WHEN** se inicia una partida multijugador 2vs2 y el juego seleccionado es RadarScan
- **THEN** el sistema inicializa el estado del juego con soporte para múltiples linternas y objetivos compartidos para cada equipo

### Requirement: Sincronización de progreso de equipo
El sistema SHALL sincronizar el progreso de la ronda entre los miembros del equipo, avanzando a la siguiente ronda solo cuando ambos objetivos hayan sido recolectados.

#### Scenario: Avance de ronda coordinado
- **WHEN** el Jugador 1 recolecta su objetivo y el Jugador 2 recolecta el suyo
- **THEN** el sistema registra el punto para el equipo y avanza a la siguiente ronda de RadarScan
