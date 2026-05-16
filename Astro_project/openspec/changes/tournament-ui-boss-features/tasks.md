## 1. Inscripción a Torneo (Backend & SQL)

- [x] 1.1 Crear el endpoint POST `/api/tournament/join` en `backend/src/routes/gameRoutes.js`.
- [x] 1.2 Implementar la lógica de servicio en `backend/src/services/gameService.js` con una transacción SQL que verifique saldo, reste el coste y registre al usuario.
- [x] 1.3 Validar respuestas de error (400 Saldo insuficiente) y éxito (200 Inscripción completada).

## 2. Inscripción a Torneo (Frontend)

- [x] 2.1 Crear el botón de inscripción en el componente de torneos de Vue.
- [x] 2.2 Conectar el botón con el servicio de API y gestionar los estados de carga y error.
- [x] 2.3 Actualizar el saldo mostrado en la UI tras una inscripción exitosa.

## 3. Reinicio de Interfaz (Vue.js)

- [x] 3.1 Refactorizar el componente de minijuego para usar un objeto de estado reactivo que se pueda inicializar con una función factory.
- [x] 3.2 Implementar el uso de `:key` dinámico en el componente padre del juego para forzar el reinicio total cuando se cambia de partida.
- [x] 3.3 Verificar que timers y listeners se limpien correctamente en `onUnmounted`.

## 4. Modo Jefe (Lógica WebSockets)

- [x] 4.1 Extender `RoomManager.js` o el servicio de multiplayer para gestionar el estado `bossHP` (inicial 100).
- [x] 4.2 Programar el manejador del evento `hero_attack` que reste 2% de vida y emita `boss_hp_update` a la sala.
- [x] 4.3 Programar el manejador del evento `boss_action` que emita un evento `apply_interference` a todos los héroes.
- [x] 4.4 Implementar el sistema de difusión de mensajes para el feed de acciones (`action_feed_update`).

## 5. Modo Jefe (Interfaz de Combate)

- [x] 5.1 Crear un componente `BossHealthBar.vue` que escuche las actualizaciones de vida.
- [x] 5.2 Implementar una capa visual de "Congelación" que se active al recibir el evento de interferencia.
- [x] 5.3 Crear el componente `ActionFeed.vue` para mostrar el historial de eventos en tiempo real.
