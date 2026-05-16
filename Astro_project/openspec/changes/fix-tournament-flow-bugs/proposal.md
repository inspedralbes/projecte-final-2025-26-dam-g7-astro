## Why

El Modo Torneo actual presenta fallos críticos que afectan la experiencia del usuario y la integridad competitiva: los espectadores ven minijuegos incorrectos, las partidas empatadas terminan sin un ganador claro, y el flujo entre combates es manual y propenso a errores. Esta propuesta busca automatizar y sincronizar completamente el ciclo de vida de un torneo.

## What Changes

- **Sincronización de Componente Espectador**: El servidor informará a los espectadores qué componente de Vue montar para asegurar que observen la misma partida que los jugadores.
- **Mecánica de Muerte Súbita**: Implementación de un estado `SUDDEN_DEATH` para desempatar partidas al agotarse el tiempo.
- **Automatización del Bracket**: Transición automática a la vista de árbol tras un combate y lanzamiento automático del siguiente enfrentamiento tras un periodo de gracia.

## Capabilities

### New Capabilities
- `tournament-spectator-sync`: Sincronización exacta del componente de minijuego y estado para observadores.
- `tournament-sudden-death`: Lógica de desempate por primer acierto tras fin de tiempo.
- `tournament-flow-automation`: Gestión automática de estados de sala entre combates de la llave.

### Modified Capabilities
- Ninguna.

## Impact

- **Backend**: Modificaciones en `RoomManager.js` para gestionar el estado `SUDDEN_DEATH` y emitir el componente activo.
- **Frontend**: Actualización de `MultiplayerLobby.vue` para montar dinámicamente el componente recibido y manejar transiciones automáticas.
- **UX**: Mayor fluidez y claridad competitiva en torneos multijugador.
