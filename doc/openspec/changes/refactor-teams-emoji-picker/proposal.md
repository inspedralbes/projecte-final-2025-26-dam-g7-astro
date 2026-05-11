## Why

Actualmente, los minijuegos cooperativos de 2 personas utilizan una lógica de división de sala en dos grandes bandos (rojo vs azul), lo cual no es óptimo para mecánicas basadas en parejas cerradas. Además, el selector de emojis en SpelledRosco es limitado, dificultando la expresividad del 'sender' al depender de una lista estática pequeña.

## What Changes

- **BACKEND (RoomManager.js)**: Implementación de un sistema de agrupación por parejas (equipos de 2) para minijuegos cooperativos específicos.
- **BACKEND (RoomManager.js)**: Asignación dinámica de sub-roles (sender/guesser) dentro de cada pareja.
- **FRONTEND (SpelledRosco.vue)**: Rediseño del selector de emojis para incluir un buscador de texto en tiempo real.
- **FRONTEND (SpelledRosco.vue)**: Integración de una biblioteca o lista extensa de emojis nativos accesibles mediante el nuevo buscador.

## Capabilities

### New Capabilities
- `pair-matching-system`: Capacidad de agrupar automáticamente a los jugadores en equipos de 2 para modos cooperativos, asegurando que cada pareja tenga los roles necesarios para el juego.
- `advanced-emoji-search`: Un componente de búsqueda que permite filtrar una base de datos extensa de emojis por nombre o etiquetas, mejorando la velocidad y precisión del envío de pistas.

### Modified Capabilities
<!-- No existen specs previas en openspec/specs -->

## Impact

- **Backend**: `RoomManager.js` sufrirá cambios en la lógica de `assignTeams` y posiblemente en la inicialización de partidas cooperativas.
- **Frontend**: `SpelledRosco.vue` requerirá una actualización significativa en la UI del rol 'sender' y posiblemente la adición de una utilidad para el manejo de la lista de emojis.
- **Protocolo WS**: Los mensajes de inicio de partida podrían llevar información más granular sobre el equipo (ej. `team-1` en lugar de `red`).
