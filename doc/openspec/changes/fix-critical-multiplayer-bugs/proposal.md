## Why

Existen bugs críticos en la sincronización del multijugador que rompen la experiencia de juego en varios minijuegos. Estos problemas incluyen desincronizaciones en el fin de ronda que expulsan a jugadores, tableros inconsistentes entre compañeros y funciones duplicadas que impiden la estabilidad del sistema.

## What Changes

- **RhymeSquad (Anti-Kick Logic)**: Se centraliza el fin de ronda en el Host. El Guest dejará de ejecutar `submitRoundResult` o `emitExit` por su cuenta para evitar desincronizaciones que resultan en la expulsión de la sala.
- **Word Construction (Tablero Absoluto y Sincronizado)**:
  - Rediseño completo para usar un sistema de coordenadas absolutas dictado por el Host.
  - Sincronización en tiempo real de `ELEMENT_MOVE` (x, y, id) con throttle.
  - Implementación de lógica de "Snap" (encaje en cajas de destino) sincronizada.
  - Corrección de Z-Index para que las piezas floten sobre la interfaz.
  - Arreglo de duplicación de pantalla en el componente de cursor remoto.
- **RadarScan (Sincronización de Tablero e Iluminación)**:
  - El Host genera y sincroniza el tablero completo (letras e intruso) con el Guest.
  - Implementación de "Linterna Compartida": las coordenadas del compañero se visualizan como un gradiente CSS dinámico, permitiendo ver qué zona está iluminando el otro.
- **Symmetry Breaker (Limpieza y Corrección de Puntuación)**:
  - Eliminación de funciones duplicadas (`update`, `draw`) para asegurar la estabilidad del componente Vue.
  - Corrección de la lógica de puntuación para que se incremente solo al capturar el objetivo, no de forma continua por frame.

## Capabilities

### New Capabilities
- `rhymesquad-host-authority`: Centralización de la transición de fin de juego en el host de la sala.
- `word-construction-sync-v2`: Sistema de sincronización de piezas con coordenadas absolutas y snap-to-target.
- `radarscan-shared-state`: Sincronización determinista del tablero y visualización de iluminación remota.
- `symmetry-breaker-stability`: Limpieza de lógica duplicada y corrección del sistema de scoring.

## Impact

- `frontend/web/src/components/games/RhymeSquad.vue`: Cambio en el flujo de finalización del juego.
- `frontend/web/src/components/games/WordConstruction.vue`: Refactorización mayor de la lógica de arrastre y sincronización de red.
- `frontend/web/src/components/games/RadarScan.vue`: Implementación de sincronización de tablero y efectos visuales de linterna.
- `frontend/web/src/components/games/SymmetryBreaker.vue`: Limpieza de código y corrección de lógica de puntos.
