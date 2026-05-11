## Why

El modo carrera competitiva añade una nueva dimensión al Astro Project, permitiendo a los jugadores enfrentarse directamente en una carrera de velocidad y resistencia. A diferencia de los modos por turnos, este modo exige rapidez mental y gestión de recursos (combustible) bajo presión, con elementos aleatorios que rompen la monotonía y añaden un factor de caos controlado.

## What Changes

- **Nuevo Modo de Juego**: "Mode Carrera" (Competitivo Simultáneo).
- **Mecánica de Carrera**: Los jugadores compiten por completar una secuencia de minijuegos predefinidos lo más rápido posible.
- **Barra de Progreso Compartida**: Visualización en tiempo real de la posición de ambos jugadores en la secuencia de juegos.
- **Sistema de Combustible Quàntic**: Recurso que disminuye con el tiempo y se recupera al completar juegos. Si llega a 0, el jugador pierde.
- **Anomalías Globales**: Eventos aleatorios (Nebulosa, Lluvia de Meteoritos, Rayo Alienígena) que afectan la visibilidad o la interacción del usuario.
- **Interfaz de Usuario**: Actualización del lobby para configurar el modo y visualización de la carrera.

## Capabilities

### New Capabilities
- `mode-carrera-core`: Lógica principal del modo carrera, incluyendo la secuencia de juegos y el estado de la competición.
- `quantum-fuel-system`: Gestión del combustible cuántico, degradación temporal y recarga por éxito.
- `global-anomalies-engine`: Sistema de disparo y ejecución de efectos ambientales aleatorios (CSS y eventos de cursor).
- `race-progress-sync`: Sincronización mediante WebSockets de la posición de los rivales en la carrera.

### Modified Capabilities
- `multiplayer-lobby`: Adaptación para permitir la creación y configuración de partidas de tipo "Carrera".

## Impact

- **Frontend**: Nuevos componentes Vue para la HUD de carrera y las anomalías.
- **Store**: Ampliación de `multiplayerStore.js` para manejar el estado del combustible y el progreso de la carrera.
- **WebSocket**: Nuevos tipos de mensajes para sincronizar el progreso individual en la secuencia de juegos.
