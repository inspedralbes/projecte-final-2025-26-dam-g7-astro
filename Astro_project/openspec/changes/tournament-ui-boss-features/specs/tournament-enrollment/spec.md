## ADDED Requirements

### Requirement: Validación de Saldo SQL
El sistema DEBE verificar si el usuario tiene saldo suficiente en la base de datos SQL antes de permitir la inscripción a un torneo.

#### Scenario: Saldo Suficiente
- **WHEN** el usuario solicita inscribirse y su saldo es mayor o igual al coste.
- **THEN** el sistema resta el coste del saldo, registra la inscripción y devuelve éxito.

#### Scenario: Saldo Insuficiente
- **WHEN** el usuario solicita inscribirse y su saldo es menor al coste.
- **THEN** el sistema devuelve un error informando de la falta de fondos y no realiza cambios en el saldo.

### Requirement: Consistencia en el Cobro
El sistema DEBE utilizar transacciones para asegurar que el descuento de saldo y el registro de inscripción ocurran de forma atómica.

#### Scenario: Fallo en registro de inscripción
- **WHEN** el saldo se resta correctamente pero falla la inserción en la tabla de participantes.
- **THEN** el sistema DEBE revertir el descuento de saldo (rollback).
