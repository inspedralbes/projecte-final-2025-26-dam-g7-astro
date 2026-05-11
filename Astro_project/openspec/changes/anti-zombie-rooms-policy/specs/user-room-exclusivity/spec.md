## ADDED Requirements

### Requirement: User Room Exclusivity Check
El sistema SHALL garantizar que un usuario solo pueda estar presente en una única sala activa a la vez. Al intentar unirse o crear una nueva sala, el sistema debe revocar automáticamente cualquier membresía previa del usuario.

#### Scenario: Usuario ya está en otra sala al crear una nueva
- **WHEN** un usuario solicita `createRoom` pero ya está registrado en el mapa `userToRoom` con una `roomId` distinta
- **THEN** el sistema ejecuta `leaveRoom` para la sala anterior antes de procesar la creación de la nueva

#### Scenario: Usuario ya está en otra sala al unirse a una
- **WHEN** un usuario solicita `joinRoom` pero ya está registrado en el mapa `userToRoom`
- **THEN** el sistema ejecuta `leaveRoom` para la sala anterior antes de añadir al usuario a la nueva sala
