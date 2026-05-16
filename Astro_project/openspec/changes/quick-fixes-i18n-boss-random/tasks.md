## 1. i18n Fixes

- [x] 1.1 Eliminar la clave duplicada `"shop"` en `frontend/web/src/i18n/locales/en.json`. Asegurarse de que la definición restante contenga todas las claves necesarias (`spinError`, `unknownPrize`, `commError`, `title`, `subtitle`, etc.).

## 2. Boss Mode Randomization

- [x] 2.1 Modificar la asignación de `room.gameConfig.boss` en `backend/src/ws/RoomManager.js` para usar selección aleatoria.
