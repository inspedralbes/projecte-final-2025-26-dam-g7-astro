## Why

Actualmente, el sistema permite que un usuario esté en múltiples salas simultáneamente o que existan salas vacías ("zombies") que consumen memoria innecesariamente. Esto causa inconsistencias en el estado de los jugadores y una degradación lenta del rendimiento del servidor por la acumulación de objetos de sala obsoletos.

## What Changes

- **BACKEND (RoomManager.js)**: Implementación de un registro global de ubicación de usuarios para garantizar la exclusividad (un usuario, una sala).
- **BACKEND (RoomManager.js)**: Modificación de los flujos de creación (`createRoom`) y unión (`joinRoom`) para forzar la salida automática de salas previas.
- **BACKEND (RoomManager.js)**: Refactorización de la lógica de salida (`leaveRoom`) y desconexión para asegurar la eliminación inmediata de salas con 0 jugadores.
- **BACKEND (RoomManager.js)**: Adición de un sistema de recolección de basura (Garbage Collector) basado en inactividad prolongada (2 horas).

## Capabilities

### New Capabilities
- `user-room-exclusivity`: Garantiza que un usuario solo pueda pertenecer a una sala activa a la vez en todo el sistema.
- `automated-zombie-cleanup`: Proceso de limpieza periódica para eliminar salas que han excedido el tiempo de inactividad permitido.

### Modified Capabilities
<!-- No existen specs previas en openspec/specs -->

## Impact

- **Backend**: `RoomManager.js` centralizará el nuevo mapa de seguimiento `userToRoom`.
- **Backend**: Los métodos `createRoom`, `joinRoom` y `leaveRoom` serán actualizados con la nueva lógica de validación y limpieza.
- **Memoria**: Reducción significativa del uso de memoria a largo plazo al prevenir la acumulación de salas huérfanas.
- **UX**: Los usuarios tendrán un flujo de navegación más coherente sin riesgo de quedar "atrapados" en sesiones antiguas.
