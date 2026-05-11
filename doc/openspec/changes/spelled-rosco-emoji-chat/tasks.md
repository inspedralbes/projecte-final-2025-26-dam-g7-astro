## 1. Lógica del Backend (WebSockets y Roles)

- [x] 1.1 Definir las constantes de sub-roles `SENDER` y `GUESSER` en el servidor.
- [x] 1.2 Registrar el manejador del evento `EMOJI_CHAT` en `RoomManager.js`.
- [x] 1.3 Implementar la lógica de retransmisión de emojis filtrada por `teamId`.
- [x] 1.4 Desarrollar la lógica de asignación inicial de roles al comenzar la partida de SpelledRosco.
- [x] 1.5 Implementar el disparador automático de intercambio de roles tras la validación de una palabra correcta.

## 2. Gestión de Estado (Pinia Store)

- [x] 2.1 Actualizar `multiplayerStore.js` para procesar los mensajes `EMOJI_CHAT` entrantes y almacenarlos en un array temporal.
- [x] 2.2 Añadir una acción `sendEmojiClue` en el store para emitir el evento vía socket.
- [x] 2.3 Manejar el evento de actualización de roles para sincronizar el estado local `subRole`.

## 3. Componentes de la Interfaz (Vue)

- [x] 3.1 Crear el componente `EmojiPicker.vue` con una cuadrícula de botones de emojis predefinidos.
- [x] 3.2 Crear el componente `EmojiHistory.vue` para mostrar la burbuja con la secuencia de pistas recibidas.
- [x] 3.3 Modificar `SpelledRosco.vue` para alternar entre el panel de emojis (Sender) y el input de texto (Guesser).
- [x] 3.4 Implementar el bloqueo visual de la definición de la palabra para el jugador con el rol `GUESSER`.
- [x] 3.5 Asegurar la integración de la fuente `OpenDyslexic` y las etiquetas ARIA para los botones de emoji.

## 4. Validación y Pruebas

- [x] 4.1 Verificar que los emojis lleguen solo al compañero de equipo y no al equipo rival.
- [x] 4.2 Probar la fluidez del intercambio de roles en una sesión multijugador real.
- [x] 4.3 Validar la legibilidad de la fuente OpenDyslexic en diferentes resoluciones.
