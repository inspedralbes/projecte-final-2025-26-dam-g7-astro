## ADDED Requirements

### Requirement: Catalan Tag Support
El sistema SHALL incluir etiquetas de búsqueda en catalán para los emojis básicos.

#### Scenario: Búsqueda exitosa en catalán
- **WHEN** el usuario escribe "gos" en el buscador de emojis
- **THEN** el sistema devuelve el emoji de perro (🐶) gracias a la etiqueta traducida

### Requirement: Robust Search Filtering
El sistema SHALL manejar las búsquedas sin coincidencias de forma segura, evitando resultados inesperados.

#### Scenario: Búsqueda sin resultados
- **WHEN** el usuario escribe un término que no coincide con ninguna etiqueta
- **THEN** la propiedad computada `filteredEmojiList` devuelve un array vacío (`[]`)
