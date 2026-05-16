## Why

Evolucionar el Modo Jefe para que sea una experiencia más asimétrica y equilibrada, alejándose de la dependencia exclusiva de los aciertos del jefe para atacar y dotando a los héroes de un sistema de supervivencia más tangible (estilo Zelda). Esto aumenta la tensión, mejora el feedback visual y aprovecha sistemas meteorológicos ya existentes en el proyecto.

## What Changes

- **Sistema de Corazones (Héroes)**: Sustitución de la eliminación directa por un sistema de vida basado en corazones (procedentes del inventario). Cada impacto resta 1/4 de corazón.
- **Panel de Control del Jefe**: Nueva interfaz lateral para el jugador "Jefe" que permite lanzar ataques basados en un temporizador (cooldown) de 30 segundos, independientemente de si acierta o no sus propios ejercicios.
- **Integración de Anomalías**: Uso de la "Lluvia de relámpagos" existente en el proyecto como una de las habilidades del Jefe.
- **Arsenal Ampliado**: Implementación de ataques como "Agujero Negro" (daño), "Gravedad Cero" (caos en la UI) y mejora del "Congelación" (bloqueo).

## Capabilities

### New Capabilities
- `boss-control-panel`: Interfaz táctica para el Jefe con gestión de cooldowns globales.
- `hero-heart-system`: Lógica de vida fraccionada (1/4 de corazón) y sincronización de estado de supervivencia.
- `boss-arsenal-actions`: Conjunto de eventos WebSocket para los nuevos ataques (`BLACK_HOLE`, `ZERO_GRAVITY`, `LIGHTNING_STORM`).

### Modified Capabilities
- `boss-mode-ws`: Extensión de la lógica de sala para gestionar la vida de los héroes y el estado de los ataques.

## Impact

- **Backend**: `RoomManager.js` gestionará el estado de salud de cada héroe y validará los ataques del jefe.
- **Frontend**: Nuevos componentes `BossPanel.vue` y `HeroHealth.vue`. Actualización de `GlobalAnomalyManager.vue` para ser disparado bajo demanda por el Jefe.
- **Estabilidad**: El cooldown de 30s asegura que el juego no se sature de efectos visuales pesados.
