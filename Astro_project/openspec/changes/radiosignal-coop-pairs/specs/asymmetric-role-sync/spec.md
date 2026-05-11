## ADDED Requirements

### Requirement: Asignación de roles Oyente/Escritor
Al inicio de cada nivel de RadioSignal, el sistema SHALL asignar el rol de 'Oyente' a un miembro de la pareja y el rol de 'Escritor' al otro.

#### Scenario: Asignación inicial de roles
- **WHEN** comienza el Nivel 1 de RadioSignal para una pareja.
- **THEN** el Jugador 1 recibe el rol 'Oyente' y el Jugador 2 recibe el rol 'Escritor'.

### Requirement: Inversión de roles tras éxito
Al superar un nivel de RadioSignal, el sistema SHALL invertir automáticamente los roles de la pareja para el siguiente nivel.

#### Scenario: Intercambio de roles tras Nivel 1
- **WHEN** la pareja supera el Nivel 1.
- **THEN** el Jugador 1 (antes Oyente) pasa a ser 'Escritor' y el Jugador 2 (antes Escritor) pasa a ser 'Oyente'.

### Requirement: Restricción de interfaz por rol
El sistema SHALL mostrar únicamente los controles de radio al 'Oyente' y únicamente el campo de entrada de texto al 'Escritor'.

#### Scenario: Interfaz del Oyente
- **WHEN** un jugador tiene el rol 'Oyente'.
- **THEN** visualiza el dial de radio y escucha el audio, pero su campo de texto está deshabilitado u oculto.
