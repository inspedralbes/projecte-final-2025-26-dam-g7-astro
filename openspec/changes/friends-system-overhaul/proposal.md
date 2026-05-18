## Why

El sistema de amigos tiene múltiples funcionalidades incompletas o con bugs: los colores del perfil del jugador no se aplican a la tarjeta con que te ven otros jugadores (la tarjeta de amigo), el buscador de personas muestra más de 9 resultados cuando se acordó un máximo de 9, y las notificaciones en tiempo real (solicitudes, eliminación de amigo, chat, desafíos) presentan inconsistencias que hacen que la experiencia multijugador sea poco fiable.

## What Changes

- **Límite de 9 exploradores** en el apartado "Buscar amigos" (actualmente muestra hasta 12)
- **Color de tarjeta del amigo** se actualiza en tiempo real cuando el usuario lo cambia en su perfil; la tarjeta que ven los demás refleja el `profileColor` guardado en la DB, que ya existe pero no se propaga por WS al cambiar
- **Solicitudes de amistad en tiempo real**: cuando A envía solicitud a B, B recibe notificación WS `FRIEND_REQUEST_UPDATE` de inmediato — ya funciona en backend, revisar que el frontend lo gestione correctamente con `FRIEND_REQUEST_UPDATE`
- **Eliminar amigo en tiempo real**: cuando A elimina a B de su lista, B recibe `FRIEND_UPDATE` y desaparece de su lista también — ya tiene lógica backend, verificar consistencia en el store
- **Chat de amigos funcional en tiempo real**: asegurar que `CHAT_MESSAGE` se entrega bidireccional y que los mensajes de desafío (`msgType: 'challenge'`) se renderizan bien en el componente de chat
- **Desafíos (Challenge) funcionales end-to-end**: flujo completo —enviar desafío → notificación popup al receptor → aceptar/rechazar → ambos redirigen a sala → chat muestra si fue aceptado o rechazado con estado visual correcto
- Corregir cooldown del botón de desafío para que se resetee correctamente cuando el desafío es rechazado/aceptado

## Capabilities

### New Capabilities
- `profile-color-realtime`: Propagación en tiempo real del `profileColor` a través de WS `FRIEND_UPDATE` cuando el usuario actualiza su color, para que las tarjetas de amigo se actualicen sin recargar la página

### Modified Capabilities
- `friends-search`: Límite máximo de 9 exploradores aleatorios (era 12)
- `challenge-flow`: Flujo de desafío completamente funcional con confirmación en chat, redirección a sala y reset de cooldown

## Impact

- **Frontend**: `friends.vue` (slice de 12→9, manejo de `FRIEND_UPDATE` para `profileColor`), componente de chat (render de estado de desafío), `multiplayerStore.js` (cooldown reset en `CHALLENGE_ACCEPTED`/`CHALLENGE_REJECTED`)
- **Backend**: `registerWsHandlers.js` (CHALLENGE_RESPONSE: enviar mensaje de chat al aceptar/rechazar con estado), `friendRoutes.js` (emitir `FRIEND_UPDATE` con `profileColor` actualizado)
- **Sin cambios de DB**: el campo `profileColor` ya existe en el modelo `User` y en la proyección de `findAllExplorers`
