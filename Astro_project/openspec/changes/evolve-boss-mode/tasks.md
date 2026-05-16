## 1. Backend: Lógica de Vidas y Ataques (Node.js)

- [x] 1.1 Inicializar `heroHealth` (3 corazones = 12 unidades) para cada héroe al comenzar el modo Jefe en `RoomManager.js`.
- [x] 1.2 Implementar el manejador de evento `BOSS_ATTACK` en `RoomManager.js` que verifique el cooldown global de 30s.
- [x] 1.3 Implementar la lógica de daño `APPLY_DAMAGE` (restar 1 unidad) y detección de eliminación (HP <= 0).
- [x] 1.4 Programar el broadcast de `HERO_ELIMINATED` y actualizar el `ACTION_FEED_UPDATE` con mensajes épicos.

## 2. Frontend: Componentes de Interfaz (Vue.js)

- [x] 2.1 Crear el componente `BossArsenalPanel.vue` con los 4 botones (Agujero Negro, Relámpagos, Congelación, Gravedad Cero).
- [x] 2.2 Implementar el temporizador de cooldown de 30s en `BossArsenalPanel.vue` con una barra de progreso visual.
- [x] 2.3 Crear el componente `HeroHearts.vue` que renderice corazones (llenos, 3/4, 1/2, 1/4, vacíos) usando iconos de Material Design (mdi-heart, mdi-heart-half, etc.).
- [x] 2.4 Integrar `HeroHearts.vue` en la barra de estado de los héroes dentro de `MultiplayerLobby.vue`.

## 3. Integración de Efectos y Arsenal

- [x] 3.1 Conectar el botón de "Relámpagos" con el evento `TRIGGER_ANOMALY` para activar `GlobalAnomalyManager.vue`.
- [x] 3.2 Implementar el efecto "Gravedad Cero" enviando un evento `APPLY_INTERFERENCE` con subtipo `SCRAMBLE`.
- [x] 3.3 Asegurar que los héroes eliminados vean un overlay de "DERROTADO" y no puedan enviar más ataques al jefe.
- [x] 3.4 Actualizar `ActionFeed.vue` para mostrar quién ha caído y qué ataque ha lanzado el jefe.
