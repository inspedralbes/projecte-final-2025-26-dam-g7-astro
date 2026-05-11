## 1. Infraestructura de Backend (Equipos y WebSockets)

- [ ] 1.1 Modificar `RoomManager.js` para asignar `teamId` a los jugadores al unirse o iniciar partida 2vs2.
- [ ] 1.2 Implementar lógica en `handleGameAction` para retransmitir acciones `MOUSE_MOVE` solo a miembros del mismo equipo.
- [ ] 1.3 Asegurar que el estado de la ronda en el backend soporte el seguimiento de dos objetivos recolectados.

## 2. Estado de Frontend (Pinia Store)

- [ ] 2.1 Añadir `remoteCursors` al estado inicial de `multiplayerStore.js`.
- [ ] 2.2 Actualizar `handleMessage` para procesar acciones `MOUSE_MOVE` y actualizar la posición del cursor del compañero.
- [ ] 2.3 Implementar `throttle` en la función `sendGameAction` para el envío de coordenadas.

## 3. Lógica y UI de RadarScan

- [ ] 3.1 Actualizar `RadarScan.vue` para recibir `isCooperative` como prop o detectarlo desde el store.
- [ ] 3.2 Modificar `updateFlashlight` para enviar las coordenadas locales al servidor.
- [ ] 3.3 Implementar el renderizado de la linterna remota en el overlay mediante CSS masks o gradientes múltiples.
- [ ] 3.4 Adaptar `generateBoard` para crear dos índices de objetivo en lugar de uno.
- [ ] 3.5 Actualizar `checkLetter` para validar que el jugador solo puede recolectar su propio objetivo.
- [ ] 3.6 Sincronizar el avance de ronda para que ocurra solo tras la recolección de ambos objetivos.

## 4. Validación y Pruebas

- [ ] 4.1 Verificar la fluidez del movimiento de la linterna remota entre dos pestañas del navegador.
- [ ] 4.2 Validar que el Jugador 1 no pueda recolectar el objetivo del Jugador 2.
- [ ] 4.3 Confirmar que la ronda avanza correctamente en ambos clientes tras completar la cooperación.
