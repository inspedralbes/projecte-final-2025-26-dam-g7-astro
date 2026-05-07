## 1. Backend: Gestión de Salas y Usuarios

- [x] 1.1 Modificar `createRoom` en `RoomManager.js` para forzar `leaveRoom` si el usuario ya tiene una sesión registrada.
- [x] 1.2 Modificar `joinRoom` en `RoomManager.js` para aplicar la misma lógica de salida automática.
- [x] 1.3 Asegurar que `leaveRoom` elimina la sala de `this.rooms` si el número de jugadores llega a cero.

## 2. Frontend: RadarScan Cooperativo

- [x] 2.1 Implementar el renderizado del cursor remoto del compañero en `RadarScan.vue` usando `multiplayerStore.remoteCursors`.
- [x] 2.2 Corregir la lógica de visualización del marcador para ocultar el separador "VS" si ambos jugadores están en el mismo equipo.

## 3. Frontend: Emojis y Buscador

- [x] 3.1 Añadir traducciones al catalán en el campo `tags` de los emojis en `frontend/web/src/constants/emojis.js`.
- [x] 3.2 Refactorizar la propiedad computada `filteredEmojiList` en `SpelledRosco.vue` para que devuelva `[]` en caso de no haber coincidencias.

## 4. Verificación y Pruebas

- [x] 4.1 Verificar que no se pueden crear salas duplicadas para un mismo usuario.
- [x] 4.2 Probar RadarScan con 2 jugadores y confirmar la visibilidad de ambas linternas.
- [x] 4.3 Confirmar que la búsqueda de emojis en catalán (ej. "gos") funciona correctamente.
