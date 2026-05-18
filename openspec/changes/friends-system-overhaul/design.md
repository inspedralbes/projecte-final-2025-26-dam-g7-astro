## Context

El proyecto AstroApp es una SPA Vue 3 (Vuetify + Pinia) con backend Express.js + MongoDB, comunicados vía REST y WebSocket. El módulo de amigos ya tiene la infraestructura básica implementada:

- **profileColor** existe en el dominio `User`, se persiste en MongoDB, se proyecta en `findAllExplorers()` y se devuelve en el login. El color ya se aplica a la tarjeta propia en `profile.vue`. La tarjeta de amigo en `friends.vue` lee `friend.profileColor` correctamente. El problema es que cuando un usuario cambia su color, el backend llama a `updateProfileColorAction` pero NO emite un `FRIEND_UPDATE` WS a sus amigos con el color actualizado.
- **Límite de exploradores**: `reloadRandomExplorers()` hace `.slice(0, 12)` cuando debe ser `.slice(0, 9)`.
- **Flujo de desafío**: el backend crea la sala y notifica `CHALLENGE_ACCEPTED` con `roomId`. El frontend en `multiplayerStore` llama a `joinRoom(roomId)` al recibirlo. Problema: el botón de desafío queda bloqueado (`challengeCooldowns[friendName] = true`) indefinidamente si el desafío es aceptado (nunca se resetea el cooldown). Además, cuando se rechaza, `setChallengeStatus` actualiza el mensaje en el chat pero no hay un mensaje de texto explícito que confirme el rechazo al challenger.
- **Chat en tiempo real**: el `CHAT_MESSAGE` WS ya funciona correctamente. El problema reportado es que los mensajes de tipo `challenge` con `status: accepted/rejected` no muestran el estado visualmente en el componente de chat.

## Goals / Non-Goals

**Goals:**
- Cambiar slice de 12 a 9 en `reloadRandomExplorers()`
- Emitir `FRIEND_UPDATE` con `profileColor` actualizado a los amigos cuando un usuario cambia su color de tarjeta
- Resetear `challengeCooldowns[friendName]` cuando llega `CHALLENGE_ACCEPTED` o `CHALLENGE_REJECTED`
- Guardar un mensaje de chat de tipo `challenge-result` cuando el desafío se acepta o rechaza, para que ambos jugadores vean el resultado en el historial de chat
- Asegurar que el componente de chat renderiza correctamente los mensajes de tipo `challenge` y `challenge-result` con su estado

**Non-Goals:**
- Rediseño del sistema de amigos
- Cambios en la lógica de creación/unión a salas multiplayer
- Cambios en la base de datos más allá de lo que ya existe

## Decisions

### D1: Emisión de FRIEND_UPDATE con profileColor

**Decisión**: Extender `userService.updateProfileColor()` para que, además de guardar el color, emita un evento `FRIEND_UPDATE` vía WS a todos los amigos del usuario con los datos actualizados del explorador (incluyendo `profileColor`).

**Alternativa considerada**: Emitir desde la ruta HTTP `/api/user/profile-color`. Se prefiere hacerlo desde el servicio para mantener la lógica en un solo lugar.

**Implementación**: En `sessionStore.updateProfileColorAction()`, después de guardar, el backend ya tiene acceso a `roomManager`. La ruta que actualiza el color debe llamar a `roomManager.sendToUser()` para cada amigo del usuario con `{ type: 'FRIEND_UPDATE', friends: ..., updatedUser: { user, profileColor } }`. El frontend ya maneja `FRIEND_UPDATE` en `multiplayerStore` → `useSocialStore().setFriends()` + `fetchAllUsers()`. Sin embargo, `fetchAllUsers()` ya descarga la lista completa con `profileColor`, así que simplemente triggear `fetchAllUsers()` en los amigos es suficiente.

### D2: Mensajes de resultado de desafío en chat

**Decisión**: En `registerWsHandlers.js`, en el handler `CHALLENGE_RESPONSE`, cuando se acepta o rechaza, guardar en DB un mensaje adicional de tipo `challenge-result` con content según resultado, y enviarlo a ambos usuarios como `CHAT_MESSAGE` con `msgType: 'challenge-result'`.

**Alternativa considerada**: Solo actualizar el status del mensaje existente (ya implementado con `setChallengeStatus`). Pero esto solo funciona si el chat está abierto; un mensaje nuevo es persistente y visible al volver a abrir el chat.

### D3: Reset de cooldown de desafío

**Decisión**: En `multiplayerStore.handleMessage()`, cuando llega `CHALLENGE_ACCEPTED` o `CHALLENGE_REJECTED`, limpiar el cooldown correspondiente de `challengeCooldowns`. El challenge store solo vive en `friends.vue`, así que el reset debe hacerse a través del store o emitiendo un evento reactivo. Como `challengeCooldowns` es un `ref` local en `friends.vue`, usar una función del `multiplayerStore` que almacene una lista de `resolvedChallenges` que `friends.vue` observe.

**Alternativa más simple**: Mover `challengeCooldowns` al `multiplayerStore` y limpiarlo directamente al recibir `CHALLENGE_ACCEPTED/REJECTED`. Esta es la opción preferida por claridad.

## Risks / Trade-offs

- **[Risk] Emisión de FRIEND_UPDATE a amigos es costosa si el usuario tiene muchos amigos** → Mitigation: los usuarios típicamente tienen pocos amigos; `sendToUser` solo envía si hay WS abierto, no hay I/O adicional.
- **[Risk] El mensaje `challenge-result` se duplica si el usuario tenía el chat abierto** → Mitigation: el deduplicador en `handleIncomingMessage` ya verifica `from + at + content`, el timestamp garantiza unicidad.
- **[Risk] El cooldown movido al multiplayerStore puede tener race conditions si el usuario tiene múltiples tabs** → No se maneja, es un caso edge no crítico.
