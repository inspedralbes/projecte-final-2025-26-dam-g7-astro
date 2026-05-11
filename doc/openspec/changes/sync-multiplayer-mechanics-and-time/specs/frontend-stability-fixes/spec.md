## ADDED Requirements

### Requirement: Suavizado de Cursores Remotos
El sistema SHALL aplicar transiciones CSS fluidas a los elementos que representan los cursores de los compañeros (`.remote-cursor`) para que su movimiento parezca continuo incluso con una tasa de refresco de red baja.

#### Scenario: Movimiento de Compañero
- **WHEN** se recibe una actualización de posición del ratón remoto
- **THEN** el elemento visual del cursor se desplaza hacia la nueva posición usando una transición `linear` o `ease-out`.

### Requirement: Precisión de Coordenadas por Porcentajes
El sistema SHALL transmitir y renderizar las posiciones de los cursores remotos y elementos de juego utilizando porcentajes relativos al contenedor padre (0-100%) en lugar de píxeles absolutos, garantizando que los cursores se sitúen sobre los mismos elementos independientemente del tamaño de pantalla de cada jugador.

#### Scenario: Diferentes Resoluciones
- **WHEN** un jugador con pantalla 4K señala una letra en el centro del tablero
- **THEN** un jugador con pantalla 1080p debe ver el cursor del compañero exactamente sobre la misma letra.
