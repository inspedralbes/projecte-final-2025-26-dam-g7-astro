## ADDED Requirements

### Requirement: Partner Cursor Visualization
El sistema SHALL renderizar en pantalla la posición del ratón de los compañeros de equipo en minijuegos que requieran coordinación visual.

#### Scenario: Visualización de linterna secundaria en RadarScan
- **WHEN** un miembro del equipo mueve su ratón en RadarScan
- **THEN** los otros miembros del equipo ven una linterna adicional (o efecto visual similar) en las coordenadas (x, y) recibidas a través de `multiplayerStore.remoteCursors`

### Requirement: Cooperative UI Context
El sistema SHALL adaptar los elementos informativos de la UI para reflejar una estructura puramente cooperativa cuando no hay equipos rivales.

#### Scenario: Ocultar comparativas VS en modo equipo único
- **WHEN** el juego detecta que todos los jugadores pertenecen al mismo ID de equipo (ej. `team-1`)
- **THEN** el sistema oculta etiquetas de confrontación como "VS" o marcadores de bando opuesto
