## Why

Existen inconsistencias graves en el multijugador que afectan la experiencia del usuario y la estabilidad del servidor: salas vacías que persisten en memoria ("zombies"), falta de feedback visual en juegos cooperativos como RadarScan, y un buscador de emojis incompleto y propenso a errores en el idioma principal del proyecto.

## What Changes

- **BACKEND (RoomManager.js)**: Implementación de una política estricta de exclusividad de sala (un usuario, una sala). El servidor forzará la salida de cualquier sala previa antes de permitir el ingreso a una nueva.
- **BACKEND (RoomManager.js)**: Limpieza automática de salas al quedar con 0 jugadores para evitar fugas de memoria.
- **FRONTEND (RadarScan.vue)**: Integración de los cursores remotos para mostrar la posición del compañero de equipo como una linterna secundaria.
- **FRONTEND (RadarScan.vue)**: Corrección de la lógica de UI para no mostrar comparativas competitivas ("VS") en partidas de un solo equipo cooperativo.
- **CONSTANTS (emojis.js)**: Adición de traducciones al catalán en las etiquetas de búsqueda de los emojis.
- **FRONTEND (SpelledRosco.vue)**: Corrección de la lógica de filtrado de emojis para manejar correctamente las búsquedas sin coincidencias.

## Capabilities

### New Capabilities
- `multiplayer-user-exclusivity`: Garantiza que un usuario no pueda tener sesiones activas en múltiples salas simultáneamente.
- `remote-cursor-visualization`: Proporciona feedback visual en tiempo real de la posición del puntero de otros miembros del equipo.
- `multilingual-emoji-search`: Soporte para múltiples idiomas (incluyendo catalán) en el sistema de etiquetas del selector de emojis.

### Modified Capabilities
<!-- No existen specs previas en openspec/specs -->

## Impact

- **Backend**: `RoomManager.js` centralizará la lógica de limpieza y exclusividad.
- **Frontend**: `RadarScan.vue` y `SpelledRosco.vue` sufrirán actualizaciones en sus componentes y lógica reactiva.
- **Memoria**: Se espera una reducción en el uso de memoria a largo plazo al eliminar salas vacías.
- **UX**: Mejora significativa en la fluidez de los minijuegos cooperativos y la precisión del selector de pistas.
