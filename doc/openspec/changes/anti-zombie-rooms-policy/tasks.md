## 1. Estructura de Datos y Seguimiento

- [x] 1.1 Añadir `this.userToRoom = new Map()` al constructor de `RoomManager.js`.
- [x] 1.2 Añadir el campo `lastActivity: Date.now()` a los objetos de sala en `createRoom`.
- [x] 1.3 Implementar una función auxiliar `updateRoomActivity(roomId)` que actualice `lastActivity`.

## 2. Política de "Un usuario, una sala"

- [x] 2.1 Modificar `createRoom` para que, si el usuario ya está en una sala (`userToRoom.has(user)`), ejecute `leaveRoom` antes de crear la nueva.
- [x] 2.2 Modificar `joinRoom` para aplicar la misma lógica de salida automática de la sala anterior.
- [x] 2.3 Asegurar que al finalizar exitosamente `createRoom` y `joinRoom`, se actualice `userToRoom` con la nueva `roomId`.

## 3. Limpieza de Salas y Garbage Collector

- [x] 3.1 Refactorizar `leaveRoom` para eliminar la entrada del usuario de `userToRoom`.
- [x] 3.2 Asegurar que en `leaveRoom`, si la sala queda vacía, se elimine de `this.rooms` y de la base de datos (incluso si no es LOBBY).
- [x] 3.3 Implementar el Garbage Collector en el `init` de `RoomManager.js` usando un `setInterval` de 30 minutos.
- [x] 3.4 El GC debe filtrar salas con `Date.now() - lastActivity > 2 * 60 * 60 * 1000` y eliminarlas de memoria y DB.

## 4. Verificación

- [x] 4.1 Verificar que abrir el juego en una nueva pestaña y crear una sala expulsa al usuario de la sala de la pestaña anterior.
- [x] 4.2 Verificar que una sala desaparece de la lista global inmediatamente después de que el último jugador sale.
- [x] 4.3 (Opcional/Test) Reducir el tiempo del GC a 1 minuto y verificar que las salas inactivas se limpian correctamente.
