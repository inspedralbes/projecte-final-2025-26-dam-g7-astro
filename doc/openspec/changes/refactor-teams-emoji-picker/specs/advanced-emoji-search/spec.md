## ADDED Requirements

### Requirement: Emoji Search Filter
El sistema SHALL proporcionar un campo de entrada de texto que filtre la lista de emojis disponibles en tiempo real según el nombre o las etiquetas del emoji.

#### Scenario: Búsqueda exitosa por nombre
- **WHEN** el usuario escribe "corazon" en el buscador
- **THEN** la lista de emojis se actualiza para mostrar solo emojis relacionados con corazones

### Requirement: Native Emoji Library
El sistema SHALL integrar una lista extensa de emojis nativos del sistema para asegurar una amplia variedad de opciones de comunicación para el 'sender'.

#### Scenario: Visualización de lista completa
- **WHEN** el buscador está vacío
- **THEN** se muestra la lista completa de emojis disponibles (categorizada o paginada si es necesario para el rendimiento)
