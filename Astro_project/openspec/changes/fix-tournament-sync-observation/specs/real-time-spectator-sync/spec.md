## ADDED Requirements

### Requirement: Retransmisión de Acciones de Juego
El servidor DEBE reenviar todos los mensajes de tipo `GAME_ACTION` (como sincronización de tablero, tiempo y puntuación) a todos los miembros de la sala, no solo a los participantes directos.

#### Scenario: Observación de Acierto de Palabra
- **WHEN** un jugador participante envía una `GAME_ACTION` de tipo `WORD_SUCCESS`.
- **THEN** el servidor retransmite ese mensaje a todos los demás miembros de la sala (espectadores).

### Requirement: Aplicación de Estado en Espectador
El componente de juego en el frontend DEBE ser capaz de actualizar su estado visual basándose en los mensajes de sincronización recibidos cuando la propiedad `isSpectator` es verdadera.

#### Scenario: Sincronización de Letras en Tiempo Real
- **WHEN** el componente recibe un mensaje `GAME_ACTION` con `action.type === 'BOARD_SYNC'` y está en modo espectador.
- **THEN** actualiza sus variables reactivas de letras y pistas para que coincidan con la partida observada.
