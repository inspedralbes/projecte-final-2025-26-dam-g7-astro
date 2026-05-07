## 1. Backend: Gestión de Equipos y Filtrado

- [x] 1.1 Implementar lógica de asignación de equipos (red/blue) al iniciar partida en `RoomManager.js`.
- [x] 1.2 Crear el método `broadcastToTeam(roomId, teamId, message)` en `RoomManager.js`.
- [x] 1.3 Modificar `handleGameAction` para detectar eventos `MOUSE_MOVE` y retransmitirlos solo al equipo.
- [x] 1.4 Asegurar que la información de `teamId` se envía en el `MATCH_STARTING`.

## 2. Frontend Store: Sincronización de Cursores

- [x] 2.1 Añadir `remoteCursors` (objeto reactivo) al estado de `multiplayerStore.js`.
- [x] 2.2 Actualizar `handleMessage` para procesar las coordenadas de los compañeros en tiempo real.
- [x] 2.3 Implementar limpieza de `remoteCursors` al finalizar la ronda o salir de la sala.

## 3. Componente RadarScan: Renderizado y Comunicación

- [x] 3.1 Implementar *throttled* mouse move (cada 50ms) que envíe coordenadas al backend.
- [x] 3.2 Refactorizar el overlay de CSS en `RadarScan.vue` para usar `mask-image` con múltiples gradientes.
- [x] 3.3 Vincular el renderizado de máscaras al objeto `remoteCursors` del store.

## 4. Lógica de Juego: Objetivos Cooperativos

- [x] 4.1 Modificar la generación del tablero para colocar tantas letras objetivo como jugadores haya en el equipo.
- [x] 4.2 Asignar cada letra a un `username` específico y enviarlo a los clientes.
- [x] 4.3 Implementar validación en el cliente para que solo se pueda clicar la letra asignada.
- [x] 4.4 Cambiar `SUBMIT_ROUND_RESULT` para que el backend espere la confirmación de todos los miembros antes de cerrar la ronda.

## 5. Verificación

- [x] 5.1 Validar la sincronización visual en un entorno con 2 o más pestañas de navegador.
- [x] 5.2 Confirmar que los jugadores pueden ayudarse mutuamente revelando zonas oscuras.
