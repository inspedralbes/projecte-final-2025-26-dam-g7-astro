## ADDED Requirements

### Requirement: Retransmisión de coordenadas de linterna
El backend DEBE retransmitir las coordenadas (X, Y) del ratón de cada jugador a todos los demás miembros de su equipo en tiempo real mediante WebSockets.

#### Scenario: Movimiento de ratón en equipo
- **WHEN** un jugador mueve su ratón dentro del área de juego.
- **THEN** el servidor envía un evento `MOUSE_MOVE` con las coordenadas y el ID del jugador a todos los compañeros del mismo `teamId`.

### Requirement: Renderizado de múltiples linternas
El frontend DEBE renderizar una máscara de luz (linterna) para cada jugador del equipo basándose en las coordenadas recibidas por WebSocket.

#### Scenario: Visualización de compañeros
- **WHEN** se reciben coordenadas de movimiento de dos compañeros de equipo.
- **THEN** la interfaz de RadarScan muestra tres círculos de luz (el propio y los dos de los compañeros) revelando el mapa.

### Requirement: Escalabilidad de máscaras de luz
El sistema DEBE ser capaz de renderizar N máscaras de luz de forma dinámica, adaptándose al número total de jugadores en el equipo.

#### Scenario: Equipo de gran tamaño
- **WHEN** hay 6 jugadores en un equipo.
- **THEN** el componente RadarScan genera y posiciona 6 máscaras de recorte sincronizadas.
