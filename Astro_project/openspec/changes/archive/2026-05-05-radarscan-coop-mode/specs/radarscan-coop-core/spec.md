## ADDED Requirements

### Requirement: Asignación dinámica de objetivos individuales
El sistema DEBE generar una letra objetivo única para cada jugador del equipo al inicio de cada ronda. Solo el jugador asignado podrá recolectar su letra específica.

#### Scenario: Generación de objetivos para un equipo de 3
- **WHEN** comienza una ronda en modo cooperativo con un equipo de 3 jugadores.
- **THEN** se generan 3 letras distintas y se asigna una exclusiva a cada jugador.

### Requirement: Validación de recolección de objetivos
El sistema DEBE verificar que la letra recolectada pertenece al jugador que realizó la acción antes de marcarla como completada.

#### Scenario: Jugador intenta recolectar letra ajena
- **WHEN** un jugador intenta recolectar una letra que ha sido asignada a otro compañero.
- **THEN** la letra no es recolectada y el sistema no registra progreso para ese jugador.

### Requirement: Condición de victoria cooperativa
La ronda DEBE finalizar ÚNICAMENTE cuando todos los jugadores del equipo han recolectado su letra asignada.

#### Scenario: Equipo completa todos los objetivos
- **WHEN** el último jugador del equipo recolecta su letra asignada.
- **THEN** la ronda finaliza para todo el equipo y se muestran los resultados.
