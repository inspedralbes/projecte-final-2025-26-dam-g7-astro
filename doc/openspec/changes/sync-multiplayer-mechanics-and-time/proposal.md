## Why

La experiencia multijugador actual difiere significativamente de la individual en términos de estética y mecánicas core, lo que genera confusión y una sensación de falta de pulido. Además, existen errores críticos en la progresión del modo RADARSCAN y en la sincronización del tiempo cuando los jugadores cambian de pestaña (Tab-Freeze), lo que rompe la competitividad y fluidez del juego.

## What Changes

- **RADARSCAN**: 
    - Restauración del efecto de niebla/linterna para igualar al modo individual.
    - Mecánica cooperativa: El Host genera una única letra intrusa. Ambos jugadores deben clicarla para confirmar y avanzar de ronda.
    - Corrección del flujo de progresión para asegurar que el cambio de ronda ocurra correctamente tras la doble confirmación.
- **WORD CONSTRUCTION**: 
    - Clonación completa del CSS e interfaz del modo individual para total paridad visual.
    - Implementación de "snap-back": las letras vuelven automáticamente a su posición inicial si se sueltan fuera de un slot válido.
- **Sincronización de Tiempo**:
    - Temporizador dictado por el Host para evitar discrepancias.
    - Lógica "Anti-Tab-Freeze" usando `Date.now()` o marcas de tiempo del servidor para calcular el tiempo real transcurrido, asegurando que el reloj no se detenga si el navegador está en segundo plano.
- **Cursores Remotos**:
    - Movimiento suavizado mediante transiciones CSS.
    - Posicionamiento exacto basado en porcentajes del contenedor para garantizar coherencia visual entre diferentes resoluciones de pantalla.

## Capabilities

### New Capabilities
- `multiplayer-radarscan-coop`: Define el comportamiento de niebla compartida y validación dual de intrusos.
- `multiplayer-time-sync`: Protocolo de sincronización de tiempo autoritativo basado en el Host con resiliencia a la inactividad de la pestaña.
- `word-construction-ui-parity`: Especificación de diseño y comportamiento (snap-back) para igualar el modo individual.

### Modified Capabilities
- `frontend-stability-fixes`: Se añaden criterios de suavizado de cursores y precisión de coordenadas.

## Impact

- **Frontend**: Modificaciones en componentes Vue de RADARSCAN y WORD CONSTRUCTION, lógica de temporizadores y renderizado de `remote-cursor`.
- **Backend/WS**: Ajustes en los manejadores de WebSocket para la sincronización de clics en RADARSCAN y la emisión de marcas de tiempo del Host.
