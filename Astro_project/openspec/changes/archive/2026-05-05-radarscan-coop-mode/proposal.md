## Why

El minijuego RadarScan actualmente carece de una experiencia cooperativa profunda. La implementación de un modo cooperativo dinámico permitirá fomentar el trabajo en equipo, aumentando el engagement de los usuarios en entornos multijugador y ofreciendo una mecánica de juego más coordinada donde el éxito depende de la colaboración de todos los miembros.

## What Changes

- **Sincronización de Linternas**: Visualización en tiempo real de las linternas de todos los compañeros de equipo en la pantalla de cada jugador.
- **Objetivos Individuales por Equipo**: Generación de letras objetivo únicas para cada jugador, que solo pueden ser recolectadas por el dueño asignado.
- **Cooperación Forzada**: La ronda solo finaliza cuando todos los miembros del equipo han recolectado su letra respectiva.
- **Escalado Dinámico**: El sistema se ajustará automáticamente al tamaño del equipo (desde 2vs2 hasta 6vs6 o más).
- **Retransmisión de Eventos**: El backend filtrará y enviará los movimientos de ratón solo a los miembros del mismo equipo para optimizar el tráfico.

## Capabilities

### New Capabilities
- `radarscan-coop-core`: Gestión de la lógica de juego cooperativo, incluyendo la asignación de objetivos y condiciones de victoria por equipo.
- `multiplayer-flashlight-sync`: Sincronización y renderizado de múltiples máscaras de luz basadas en los movimientos de los compañeros.

### Modified Capabilities
(Ninguna)

## Impact

- **Backend**: 
    - `src/services/multiplayerService.js`: Actualización para manejar `teamId` y retransmisión de eventos.
    - `src/ws/RoomManager.js`: Lógica de agrupación de jugadores por equipo.
- **Frontend**:
    - `src/stores/multiplayerStore.js`: Estado para múltiples cursores remotos por equipo.
    - `src/components/games/RadarScan.vue`: Renderizado de múltiples linternas y validación de objetivos.
