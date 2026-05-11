## Why

Tras una revisión inicial de `RhymeSquad.vue` y `MultiplayerLobby.vue`, se ha detectado que el patrón de accesos inseguros al objeto `multiplayerStore.room` es un problema sistémico en varios componentes del juego. Estos accesos sin encadenamiento opcional (`?.`) provocan excepciones de tipo "Cannot read property of null" cuando un jugador se desconecta o la sala se cierra inesperadamente, resultando en crasheos del frontend. Además, persisten advertencias de consola por el uso de variantes de Vuetify no soportadas.

## What Changes

- **Auditoría Global de Room Access**:
  - Se aplicará encadenamiento opcional (`?.`) en todos los accesos a `multiplayerStore.room` en los componentes: `RadarScan.vue`, `RadioSignal.vue`, `SpelledRosco.vue`, `WordConstruction.vue` y `MatchResultScreen.vue`.
- **Verificación Final de RhymeSquad & Lobby**:
  - Asegurar que todas las primitivas de Vue (`computed`, `ref`, `watch`) estén importadas explícitamente.
  - Confirmar que no queden rastros de `variant="dashed"` en componentes Vuetify, sustituyéndolos por `variant="outlined"` + clase CSS `.border-dashed`.

## Capabilities

### New Capabilities
- `frontend-fail-safe-state`: Implementación de una capa de acceso seguro al estado global del juego para prevenir excepciones por estados nulos o indefinidos durante la sincronización multijugador.

## Impact

- `frontend/web/src/components/games/*.vue`: Mejora de la robustez ante desconexiones.
- `frontend/web/src/components/multiplayer/MatchResultScreen.vue`: Prevención de crasheos al mostrar resultados finales.
- `frontend/web/src/pages/friends/MultiplayerLobby.vue`: Eliminación total de advertencias de consola de Vuetify.
