## ADDED Requirements

### Requirement: Generación de objetivos duales
El sistema SHALL generar dos objetivos distintos (por ejemplo, dos letras diferentes) para cada equipo en cada ronda de RadarScan cooperativo.

#### Scenario: Distribución de objetivos
- **WHEN** comienza una ronda en modo cooperativo
- **THEN** el sistema asigna el Objetivo A al primer jugador del equipo y el Objetivo B al segundo jugador

### Requirement: Validación de recolección selectiva
El sistema SHALL restringir la capacidad de recolectar un objetivo basándose en la identidad del jugador; cada jugador solo MUST poder recolectar su objetivo asignado.

#### Scenario: Intento de recolección de objetivo ajeno
- **WHEN** el Jugador 1 hace clic sobre el Objetivo B (asignado al Jugador 2)
- **THEN** el sistema ignora el clic y el objetivo permanece en el mapa

#### Scenario: Recolección exitosa de objetivo propio
- **WHEN** el Jugador 1 hace clic sobre el Objetivo A (asignado a él)
- **THEN** el Objetivo A desaparece y se marca como recolectado para el equipo
