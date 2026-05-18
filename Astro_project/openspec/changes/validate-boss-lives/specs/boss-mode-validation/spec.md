## ADDED Requirements

### Requirement: Validación de Vidas para Modo Boss
El sistema SHALL verificar que el usuario tenga al menos una unidad del item "Pack de Vidas" (ID 1) en su inventario antes de permitir la activación o el inicio de una partida en Modo Boss.

#### Scenario: Intento de selección de Modo Boss sin vidas
- **WHEN** el usuario intenta cambiar la modalidad de juego a "boss" y no tiene "Pack de Vidas" en el inventario
- **THEN** el sistema debe mostrar un mensaje de error y no cambiar la modalidad

#### Scenario: Intento de inicio de partida Modo Boss sin vidas
- **WHEN** el host intenta iniciar la partida (startMatch) en modalidad "boss" y no tiene "Pack de Vidas" en el inventario
- **THEN** el sistema debe mostrar un mensaje de error e impedir el inicio de la partida

#### Scenario: Validación exitosa de vidas
- **WHEN** el usuario tiene al menos un "Pack de Vidas" y selecciona o inicia el Modo Boss
- **THEN** el sistema debe permitir la acción sin mostrar errores de validación de inventario
