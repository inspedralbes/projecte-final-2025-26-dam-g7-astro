## ADDED Requirements

### Requirement: Sincronización de doble linterna en RadarScan
El juego RadarScan en modo 2vs2 cooperativo DEBERÁ mostrar y sincronizar dos linternas activas (una para cada jugador) en el mismo tablero compartido en tiempo real.

#### Scenario: Visualización y movimiento de doble linterna
- **WHEN** el jugador local y su compañero mueven el ratón sobre el radar
- **THEN** ambos jugadores visualizan su propio haz de luz y el haz de luz del compañero desplazándose por la cuadrícula en tiempo real.

### Requirement: Búsqueda simultánea de celdas objetivo
Ambos jugadores DEBERÁN buscar y revelar las celdas objetivo (letras erróneas) en el mismo tablero compartido de forma que cualquier revelación se propague al compañero de inmediato.

#### Scenario: Revelación sincronizada de celdas
- **WHEN** cualquiera de los dos jugadores hace clic en una celda correcta o incorrecta del tablero
- **THEN** la celda se revela en las pantallas de ambos jugadores con el mismo estado de acierto o fallo en tiempo real.
