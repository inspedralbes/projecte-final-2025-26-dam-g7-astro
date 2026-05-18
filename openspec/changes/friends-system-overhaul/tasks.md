## 1. Límite de exploradores en Buscar Amigos

- [ ] 1.1 En `friends.vue`, cambiar `.slice(0, 12)` a `.slice(0, 9)` en la función `reloadRandomExplorers()`

## 2. Color de Tarjeta de Amigo (cómo te ven los demás)

- [ ] 2.1 En `profile.vue`, renombrar/actualizar el label del selector de color de `$t('profile.cardColor')` para que indique claramente que es "el color con el que te ven los demás" (ej. "Color de tu tarjeta de amigo" o "Así te verán tus amigos"), NO el color de tu propio perfil
- [ ] 2.2 Verificar que `profile.vue` NO usa `profileColor` para colorear la tarjeta de perfil propio (línea 10: `:style="{ background: profileColor... }"`) — si lo hace, desacoplar: la tarjeta de perfil debe tener su propio fondo fijo, y `profileColor` solo debe afectar la tarjeta de amigo visible a otros
- [ ] 2.3 Confirmar que `friends.vue` aplica `friend.profileColor` como fondo de las tarjetas de amigo (líneas 62 y 208) — ya está implementado; verificar que funciona con todos los 8 colores del paleta
- [ ] 2.4 En el backend, en el endpoint que actualiza `profileColor` (en `sessionStore.updateProfileColorAction` → ruta HTTP), añadir llamada a `roomManager.sendToUser()` para cada amigo del usuario con `{ type: 'FRIEND_UPDATE', friends: updatedFriendsList }` — esto hace que el frontend de los amigos ejecute `fetchAllUsers()` y recargue el `profileColor` actualizado en sus tarjetas
- [ ] 2.5 Comprobar que `multiplayerStore.js` maneja `FRIEND_UPDATE` llamando a `useSocialStore().fetchAllUsers()` y que los datos devueltos por `/api/users` incluyen `profileColor` (ya está en la proyección `findAllExplorers()` — solo verificar)

## 3. Sistema de Desafíos: Backend

- [ ] 3.1 En `registerWsHandlers.js`, en el case `CHALLENGE_RESPONSE`, cuando `accepted: true`, guardar en DB un mensaje de chat con `{ from: msg.from, to: msg.to, content: '✅ ¡Desafío aceptado! Preparando la batalla...', type: 'challenge-result' }` y emitirlo como `CHAT_MESSAGE` a ambos usuarios
- [ ] 3.2 En `registerWsHandlers.js`, en el case `CHALLENGE_RESPONSE`, cuando `accepted: false`, guardar en DB un mensaje de chat con `{ content: '❌ Desafío rechazado', type: 'challenge-result' }` y emitirlo como `CHAT_MESSAGE` a ambos usuarios (el challenger y el que rechazó)
- [ ] 3.3 Asegurar que el `CHALLENGE_RESPONSE` handler envía correctamente `CHALLENGE_ACCEPTED` con `roomId` al challenger (`msg.to`) y al que aceptó (`msg.from`) por separado cuando es necesario

## 4. Sistema de Desafíos: Frontend — Cooldown y Navegación

- [ ] 4.1 Mover `challengeCooldowns` de ref local en `friends.vue` al `multiplayerStore.js` como parte del estado del store
- [ ] 4.2 En `multiplayerStore.handleMessage()`, cuando llega `CHALLENGE_ACCEPTED`, limpiar `challengeCooldowns[data.from]` (o el usuario desafiado) y navegar al lobby de la sala (`router.push('/multiplayer')`)
- [ ] 4.3 En `multiplayerStore.handleMessage()`, cuando llega `CHALLENGE_REJECTED`, limpiar `challengeCooldowns[data.to]` después de 3 segundos
- [ ] 4.4 En `friends.vue`, actualizar referencias a `challengeCooldowns` para leerlas desde `multiplayerStore` en lugar del ref local
- [ ] 4.5 En `friends.vue`, añadir un timeout de 30 segundos en `challengeFriend()` que limpie el cooldown automáticamente si no llega respuesta (por si el amigo no está conectado)

## 5. Sistema de Desafíos: Frontend — Chat Visual

- [ ] 5.1 En el componente de chat (`ChatOverlay.vue` o equivalente), añadir renderizado especial para mensajes con `msgType === 'challenge'`: mostrar ícono de espada, fondo amber/orange, texto "¡Te ha desafiado a un duelo!" con botones Aceptar/Rechazar si `status === 'pending'` y el `from` no es el usuario actual
- [ ] 5.2 En el componente de chat, añadir renderizado para `msgType === 'challenge-result'`: mostrar en verde si contiene "✅" y en rojo si contiene "❌", con un ícono apropiado
- [ ] 5.3 Asegurar que `setChallengeStatus()` en `chatStore.js` actualiza correctamente el status del mensaje challenge existente cuando llega `CHALLENGE_ACCEPTED` o `CHALLENGE_REJECTED`

## 6. Amigos en Tiempo Real: Verificación y Fixes

- [ ] 6.1 Probar el flujo completo: A envía solicitud → B recibe notificación en la tab "Solicitudes" sin recargar → B acepta → A recibe actualización en su lista de amigos en tiempo real
- [ ] 6.2 Probar el flujo de eliminar amigo: A elimina a B → B desaparece de la lista de A en tiempo real → A desaparece de la lista de B en tiempo real
- [ ] 6.3 Verificar que `FRIEND_REQUEST_UPDATE` y `FRIEND_ACCEPT_NOTIF` se procesan en `multiplayerStore` y actualizan el store correctamente (revisar `useSocialStore().setFriendRequests()`)
- [ ] 6.4 Verificar que `FRIEND_UPDATE` después de eliminar amigo llama a `fetchAllUsers()` para actualizar la lista de exploradores disponibles

## 7. Chat en Tiempo Real: Verificación

- [ ] 7.1 Probar que enviar un mensaje a un amigo lo entrega en tiempo real al destinatario si está conectado
- [ ] 7.2 Probar que los mensajes no se duplican (la deduplicación por `from + at + content` funciona)
- [ ] 7.3 Verificar que los mensajes no leídos (`unreadCounts`) se incrementan cuando llega un mensaje y el chat no está abierto con ese amigo
- [ ] 7.4 Verificar que al abrir el chat de un amigo, los mensajes se marcan como leídos y el badge desaparece
