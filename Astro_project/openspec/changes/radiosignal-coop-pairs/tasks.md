## 1. Backend: Lógica de Parejas y Roles

- [ ] 1.1 Modificar `RoomManager.js` para incluir la lógica de agrupación en parejas al iniciar RadioSignal.
- [ ] 1.2 Implementar la asignación inicial de sub-roles (`listener`/`writer`) en el estado de la sala.
- [ ] 1.3 Crear el handler para el mensaje `TYPING_SYNC` que retransmite el texto al compañero de pareja.
- [ ] 1.4 Implementar la lógica de inversión de roles al recibir una validación de nivel exitosa.

## 2. Frontend Store: Estado Cooperativo

- [ ] 2.1 Añadir `subRole` y `partnerText` al estado de la `multiplayerStore.js`.
- [ ] 2.2 Actualizar `handleMessage` para procesar eventos de sincronización de roles y de escritura.
- [ ] 2.3 Crear una acción `sendTypingSync` para notificar cambios en el input local al servidor.

## 3. RadioSignal: Refactorización de Interfaz

- [x] 3.1 Modificar `RadioSignal.vue` para detectar el `subRole` desde el store.
- [x] 3.2 Implementar renderizado condicional: ocultar dial de radio para el 'Escritor' y deshabilitar input para el 'Oyente'.
- [x] 3.3 Añadir la visualización del `partnerText` con indicador de "Compañero escribiendo...".
- [x] 3.4 Vincular el input del 'Escritor' con la acción de sincronización de typing (con throttle de 100ms).

## 4. Accesibilidad y Estilo

- [ ] 4.1 Añadir la fuente OpenDyslexic a los activos del proyecto.
- [x] 4.2 Implementar el switch de accesibilidad en la UI del juego.
- [x] 4.3 Aplicar la fuente dinámicamente según la preferencia del usuario.

## 5. Verificación y Pruebas

- [ ] 5.1 Validar el flujo completo de una ronda con intercambio de roles.
- [ ] 5.2 Comprobar que la retransmisión de escritura no genera lag excesivo en el 'Oyente'.
- [ ] 5.3 Verificar la correcta visualización de mensajes de guía visual ("Tú escuchas" / "Tú escribes").
