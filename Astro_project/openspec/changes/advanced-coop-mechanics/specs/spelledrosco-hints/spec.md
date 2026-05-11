## ADDED Requirements

### Requirement: SpelledRosco intelligent hints
El sistema DEBE mostrar pistas dinámicas sobre la categoría y el tipo de palabra para el jugador que debe adivinar ('guesser').

#### Scenario: Displaying hints for a verb
- **WHEN** el juego carga una nueva palabra que es un verbo (ej: 'programar')
- **THEN** el componente muestra dos chips con las etiquetas 'ACCIONES/TECNOLOGÍA' (o similar) y 'VERBO'

#### Scenario: Categorization of common words
- **WHEN** la palabra actual es 'estrella'
- **THEN** el componente muestra el chip de categoría 'ESPACIO'
