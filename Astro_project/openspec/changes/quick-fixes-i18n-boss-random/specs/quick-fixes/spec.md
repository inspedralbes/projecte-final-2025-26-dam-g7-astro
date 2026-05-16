## ADDED Requirements

### Requirement: Validez del Archivo de Localización
El archivo `en.json` DEBE ser un JSON válido y no contener claves duplicadas en el mismo nivel de objeto.

#### Scenario: Eliminación de clave duplicada
- **GIVEN** un archivo JSON con la clave `"shop"` definida en la línea 59 y 637.
- **WHEN** el sistema carga el archivo.
- **THEN** solo debe existir una definición de `"shop"` que contenga todas las sub-claves necesarias.

### Requirement: Jefe Aleatorio
El sistema DEBE elegir al "Jefe" de forma aleatoria entre todos los jugadores que han entrado en la sala.

#### Scenario: Inicio de Modo Jefe
- **WHEN** se inicia una partida en modo Jefe.
- **THEN** el sistema selecciona un jugador al azar de la lista de participantes y le asigna el rol de BOSS.
