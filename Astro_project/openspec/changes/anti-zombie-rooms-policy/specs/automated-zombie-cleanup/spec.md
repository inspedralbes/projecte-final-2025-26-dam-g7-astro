## ADDED Requirements

### Requirement: Zero Players Room Deletion
El sistema SHALL eliminar inmediatamente cualquier sala de la memoria (mapa `rooms`) cuando el número de jugadores activos llegue a cero.

#### Scenario: Último jugador sale de la sala
- **WHEN** el último jugador de una sala ejecuta `leaveRoom` o se desconecta
- **THEN** el sistema elimina la entrada de la sala del mapa `rooms` y limpia las referencias asociadas

### Requirement: Periodic Inactivity Cleanup
El sistema SHALL ejecutar un proceso periódico (Garbage Collector) para identificar y eliminar salas que han estado inactivas por más de 2 horas.

#### Scenario: Ejecución del Garbage Collector
- **WHEN** el intervalo de tiempo configurado se cumple
- **THEN** el sistema recorre todas las salas y elimina aquellas cuya última actividad registrada (o creación si no hay actividad) sea superior a 2 horas
