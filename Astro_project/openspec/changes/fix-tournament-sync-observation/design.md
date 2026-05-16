## Context

Actualmente, el modo Torneo presenta problemas de sincronización donde los jugadores quedan atrapados en pantallas de transición. Además, la funcionalidad de observación está incompleta porque el servidor no reenvía las acciones de los jugadores activos a los observadores.

## Goals / Non-Goals

**Goals:**
- Asegurar que todos los jugadores en una sala reciban el evento de inicio de partida.
- Implementar un sistema de broadcast en `RoomManager.js` que envíe mensajes de tipo `GAME_ACTION` a todos los miembros de la sala.
- Habilitar en el frontend la capacidad de recibir y aplicar estados de juego sin ser un jugador activo.

**Non-Goals:**
- Rediseñar el sistema de brackets del torneo.
- Implementar chat en tiempo real para espectadores.

## Decisions

- **Difusión Total de Acciones**: En lugar de enviar acciones solo a los oponentes, `RoomManager.js` utilizará `broadcastToRoom` para enviar todas las `GAME_ACTION`. Esto incluye `BOARD_SYNC`, `TIME_SYNC`, `SCORE_UPDATE`, etc.
- **Modo Espectador Reactivo**: Los componentes de juego (ej. `WordConstruction.vue`) usarán un watcher sobre `multiplayerStore.lastMessage`. Si el componente tiene `props.isSpectator`, aplicará los datos recibidos (letras, puntos, tiempo) al estado local para renderizar la partida.
- **Sincronización de Estado de Sala**: El servidor emitirá un mensaje de estado de sala consolidado justo antes de empezar, asegurando que todos los clientes tengan la misma configuración de juego.

## Risks / Trade-offs

- [Risk] **Sobrecarga de Red** → [Mitigación] Las acciones de juego son pequeñas (JSONs de pocos bytes). El número máximo de jugadores por sala (16) es bajo, por lo que el tráfico es manejable.
- [Risk] **Latencia en la Observación** → [Mitigación] Se priorizarán los mensajes de estado crítico. Los observadores verán la partida con una latencia mínima de milisegundos inherente a WebSockets.
