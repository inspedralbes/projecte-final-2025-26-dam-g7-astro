## Context

El `RoomManager` actual gestiona las salas en memoria usando un mapa `this.rooms`. Sin embargo, no hay un seguimiento inverso (usuario -> sala), lo que permite que un usuario abra múltiples pestañas o use diferentes clientes para estar en varias salas a la vez. Además, aunque existe un `idleTimer` de 15 minutos para el lobby, salas que quedan en otros estados (ej. `PLAYING` o `GAME_OVER`) pueden quedar huérfanas si los jugadores se desconectan de forma abrupta y no se activa correctamente el cleanup.

## Goals / Non-Goals

**Goals:**
- Implementar un mapa `userToRoom` para rastrear la ubicación de cada usuario.
- Garantizar que un usuario salga de cualquier sala previa antes de entrar a una nueva.
- Asegurar que salas con 0 jugadores sean eliminadas de memoria y base de datos.
- Añadir un Garbage Collector periódico para salas inactivas.

**Non-Goals:**
- Implementar un sistema de reconexión persistente (fuera del alcance actual).
- Modificar el esquema de la base de datos (se usará el estado en memoria para la limpieza).

## Decisions

### 1. Mapa global `userToRoom`
**Decisión:** Añadir `this.userToRoom = new Map()` al constructor de `RoomManager`.
**Rationale:** Permite búsquedas O(1) para saber si un usuario ya está en una sala, evitando tener que iterar por todas las salas en cada acción de unión/creación.

### 2. Hook de salida automática
**Decisión:** En `createRoom` y `joinRoom`, verificar si el usuario existe en `userToRoom`. Si existe, llamar a `leaveRoom(oldRoomId, user)` antes de proceder.
**Rationale:** Mantiene la integridad del estado del usuario sin requerir intervención manual o errores de "ya estás en una sala".

### 3. Timestamp `lastActivity` y Garbage Collector
**Decisión:** Añadir `lastActivity: Date.now()` a cada sala y actualizarlo en acciones clave (mensajes WS, cambios de estado). Iniciar un `setInterval` cada 30 minutos que elimine salas con `Date.now() - lastActivity > 2 horas`.
**Rationale:** El `idleTimer` actual solo funciona en el lobby. Un GC global es una red de seguridad necesaria para fugas de memoria en otros estados del juego.

## Risks / Trade-offs

- **[Risk]** Un usuario podría ser expulsado de una sala legítima si hay una colisión de nombres de usuario o sesión. → **Mitigation**: El sistema de autenticación ya garantiza IDs únicos.
- **[Risk]** El GC podría eliminar una partida muy larga que esté activa. → **Mitigation**: El timestamp se actualizará con cada acción de juego, asegurando que solo salas realmente inactivas sean eliminadas.
