## ADDED Requirements

### Requirement: Disparo de Anomalías
El sistema debe activar efectos aleatorios periódicamente durante la carrera.

#### Scenario: Activación de Nebulosa
- **WHEN** Se dispara el evento 'Nebulosa'.
- **THEN** Se aplica una capa CSS que oscurece u obstruye la visión del área de juego durante X segundos.

#### Scenario: Pluja de Meteorits
- **WHEN** Se dispara el evento 'Meteoritos'.
- **THEN** Caen elementos visuales por la pantalla; si el cursor entra en contacto con ellos, se deshabilita la interacción de clic por 2 segundos.

#### Scenario: Raig Alienígena
- **WHEN** Se dispara el evento 'Rayo'.
- **THEN** El cursor del ratón cambia su tamaño a uno gigante y molesto, dificultando la precisión.
