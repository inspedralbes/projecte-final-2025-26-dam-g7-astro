## Context

"SpelledRosco" es un minijuego de deletreo. Para la versión cooperativa 2vs2, necesitamos transformar la mecánica individual en una de equipo donde la comunicación esté restringida. El sistema actual de multijugador utiliza WebSockets coordinados por un `RoomManager` en el backend y Pinia stores (`multiplayerStore`) en el frontend.

## Goals / Non-Goals

**Goals:**
- Crear un canal de comunicación en tiempo real basado únicamente en emojis para parejas.
- Implementar la lógica de sub-roles (`sender` y `guesser`) con permisos y vistas diferenciadas.
- Sincronizar el intercambio de roles tras cada acierto validado por el servidor.
- Asegurar que el 'Adivinador' no tenga acceso a la palabra secreta a través del estado del componente.

**Non-Goals:**
- Permitir chat de texto libre entre la pareja.
- Modificar el sistema de validación de palabras base de SpelledRosco (se mantiene la comprobación de texto normal).
- Implementar un selector de emojis complejo (se usará una lista estática predefinida).

## Decisions

- **Evento WebSocket `EMOJI_CHAT`**: Se añadirá un nuevo tipo de mensaje al `RoomManager.js`. Cuando el servidor reciba un `EMOJI_CHAT`, identificará el `teamId` del remitente y retransmitirá el objeto `{ emoji, from }` exclusivamente al compañero.
- **Gestión de Sub-Roles**: El backend gestionará el estado de los roles en el objeto `gameConfig` de la sala. Al inicio y tras cada acierto, el servidor enviará un evento `ROLES_UPDATED` para que los clientes actualicen su interfaz.
- **Renderizado en Vue**: Se usará un `v-if` basado en `subRole` dentro de `SpelledRosco.vue`. El `sender` verá un componente `<EmojiPicker />` y el `guesser` verá un componente `<EmojiChatDisplay />` y el input de texto estándar.
- **Seguridad de la Palabra**: La palabra secreta se enviará al cliente del `sender`, pero al cliente del `guesser` solo se le enviará la letra inicial (`char`) para evitar que pueda verla inspeccionando el estado de Vue (en la medida de lo posible sin cambiar todo el protocolo de entrega de palabras).

## Risks / Trade-offs

- **[Riesgo] Spam de Emojis** → **Mitigación**: Implementar un throttle de 500ms en el cliente para el envío de emojis.
- **[Riesgo] Latencia en el Swap** → **Mitigación**: El intercambio de roles debe ser la respuesta al evento `CORRECT_ANSWER` del servidor, asegurando que ambos clientes cambian al unísono.
- **[Riesgo] Emojis ambiguos** → **Mitigación**: Proporcionar una lista curada de emojis que incluyan categorías de "Naturaleza", "Acción", "Objetos" y "Colores".
