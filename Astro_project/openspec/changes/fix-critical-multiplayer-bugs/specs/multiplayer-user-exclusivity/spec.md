## ADDED Requirements

### Requirement: Single Session Enforcement
El sistema SHALL garantizar que un usuario solo pueda estar presente en una única sala de juego a la vez.

#### Scenario: Creación de sala con sesión previa
- **WHEN** un usuario intenta crear una sala (`createRoom`) y ya existe un registro de su presencia en otra sala activa
- **THEN** el sistema ejecuta automáticamente `leaveRoom` de la sala anterior antes de procesar la creación de la nueva

#### Scenario: Unión a sala con sesión previa
- **WHEN** un usuario intenta unirse a una sala (`joinRoom`) y ya pertenece a otra sala diferente
- **THEN** el sistema ejecuta automáticamente `leaveRoom` de la sala anterior antes de permitir el ingreso a la nueva

### Requirement: Automated Empty Room Cleanup
El sistema SHALL eliminar cualquier instancia de sala del mapa global si el número de jugadores activos se reduce a cero.

#### Scenario: Último jugador abandona la sala
- **WHEN** un jugador sale de una sala y `room.players.size` resulta en cero
- **THEN** el sistema elimina la sala de `this.rooms` para liberar memoria
