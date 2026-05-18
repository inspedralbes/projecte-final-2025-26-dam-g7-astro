## Why

Para aumentar la competitividad y el dinamismo en los duelos 1vs1, se busca implementar una mecánica de "robo de tiempo" similar a sistemas de ajedrez o juegos de lucha, donde el acierto no solo beneficia al jugador sino que perjudica directamente al oponente. Por otro lado, para el modo 2vs2 (equipos), es necesario garantizar la integridad del juego forzando equipos equilibrados de exactamente 2 jugadores por bando.

## What Changes

- **Tiempo Base 1vs1**: Ajustar el tiempo inicial a 150 segundos para duelos directos y torneos.
- **Transferencia de Tiempo**: En duelos 1vs1, cada acierto (SCORE_UPDATE) sumará 3 segundos al jugador actual y restará 3 segundos al rival.
- **Restricción 2vs2**: Validación en el backend para impedir el inicio de partidas en modo equipos si no hay exactamente 2 jugadores por equipo.

## Capabilities

### New Capabilities
- duel-time-transfer: Mecánica de suma/resta de tiempo dinámica entre oponentes.
- 	eam-size-enforcement: Validación estricta de quórum por equipo antes de iniciar.

### Modified Capabilities
- multiplayer-timer: Ahora soporta modificaciones relativas entre múltiples usuarios simultáneamente.

## Impact

- **Backend**: Modificaciones críticas en RoomManager.js dentro de startRoundTimer y handleGameAction.
- **Frontend**: Mejora visual del feedback cuando el tiempo aumenta o disminuye bruscamente (opcional, centrado en lógica por ahora).
