## ADDED Requirements

### Requirement: Sincronización de posición de linterna
El sistema SHALL transmitir las coordenadas (x, y) del ratón de cada jugador a su compañero de equipo en tiempo real.

#### Scenario: Movimiento de linterna remota
- **WHEN** el Jugador 1 mueve su ratón dentro del área de juego de RadarScan
- **THEN** el sistema envía un evento de actualización de posición al Jugador 2 (su compañero)
- **THEN** la interfaz del Jugador 2 muestra un segundo círculo de luz en las coordenadas recibidas

### Requirement: Renderizado de múltiples linternas
La interfaz de RadarScan SHALL ser capaz de renderizar dos máscaras de recorte (linternas) simultáneamente en el modo cooperativo.

#### Scenario: Visualización de linterna aliada
- **WHEN** se recibe una actualización de posición del compañero de equipo
- **THEN** el componente RadarScan actualiza la posición de la "linterna remota" y revela el área correspondiente del mapa
