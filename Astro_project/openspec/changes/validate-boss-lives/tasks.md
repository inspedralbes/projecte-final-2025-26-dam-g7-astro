## 1. Preparación del Store

- [x] 1.1 Importar `useInventoryStore` en `multiplayerStore.js` (si no está ya disponible).
- [x] 1.2 Implementar el getter `canAccessBossMode` en `multiplayerStore.js` que verifique la existencia de "Pack de Vidas" (ID 1) con cantidad > 0.
- [x] 1.3 Implementar la acción `validateBossAccess` en `multiplayerStore.js` que devuelva un objeto con el estado de la validación y un mensaje de error localizado.

## 2. Refactorización de la UI

- [x] 2.1 Actualizar la función de selección de modalidad en `MultiplayerLobby.vue` para usar `multiplayerStore.validateBossAccess()`.
- [x] 2.2 Actualizar la función `startMatch` en `MultiplayerLobby.vue` para usar `multiplayerStore.validateBossAccess()` en lugar de la búsqueda manual en el inventario.
- [x] 2.3 Verificar que los mensajes de error mostrados al usuario coinciden con los esperados y están correctamente localizados.

## 3. Validación y Pruebas

- [x] 3.1 Probar que un usuario sin vidas no puede seleccionar el Modo Boss.
- [x] 3.2 Probar que un host sin vidas no puede iniciar la partida en Modo Boss.
- [x] 3.3 Probar que un usuario con vidas puede seleccionar e iniciar el Modo Boss correctamente.
