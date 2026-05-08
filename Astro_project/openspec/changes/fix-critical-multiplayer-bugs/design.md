## Context

Varios minijuegos presentan fallos de sincronización y bugs lógicos en el modo multijugador. Estos problemas van desde desincronizaciones de estado (Word Construction, RadarScan) hasta errores de flujo (RhymeSquad) y redundancia de código (Symmetry Breaker). El objetivo es centralizar la autoridad en el Host y unificar la visualización del estado compartido.

## Goals / Non-Goals

**Goals:**
- Centralizar el fin de ronda en el Host para evitar expulsiones accidentales.
- Implementar un sistema de coordenadas absolutas y sincronización determinista en Word Construction.
- Sincronizar el tablero y la iluminación en RadarScan.
- Limpiar el código redundante en Symmetry Breaker y corregir su sistema de puntuación.

**Non-Goals:**
- No se realizarán cambios en el Backend. Toda la lógica de sincronización se basará en los mensajes existentes del `multiplayerStore`.
- No se rediseñará el arte de los juegos, solo su comportamiento lógico y visualización técnica (linternas, z-index).

## Decisions

### 1. RhymeSquad: Host-Only Termination
- **Decisión**: Solo el Host invocará `multiplayerStore.submitRoundResult()`. El Guest simplemente detendrá su lógica local al recibir el evento `ROUND_ENDED_BY_WINNER` del servidor.
- **Razón**: Evita que una diferencia de milisegundos en los timers locales cause que el servidor reciba múltiples señales contradictorias de fin de ronda.

### 2. Word Construction: Coordenadas Absolutas y Snap Sincronizado
- **Decisión**: El tablero usará un sistema de coordenadas de 0 a 1000 (normalizado) que se escalará al tamaño del contenedor. El Host enviará la posición inicial de todas las letras vía `BOARD_SYNC`.
- **Decisión**: El evento `ELEMENT_MOVE` enviará `{ id, x, y }` usando el sistema normalizado.
- **Decisión**: La lógica de "Snap" (colocar letra en slot) se ejecutará localmente pero se validará visualmente mediante el estado compartido de los slots.

### 3. RadarScan: Shared Illumination via CSS
- **Decisión**: La `flashlightStyle` calculará un array de gradientes radiales. El primer gradiente será para el cursor local y los siguientes para los cursores contenidos en `multiplayerStore.remoteCursors`.
- **Decisión**: Se usará `mask-image` o un `background` múltiple con `mix-blend-mode: hard-light` (o similar) para asegurar que la unión de dos linternas sume luz en lugar de simplemente superponerse.

### 4. Symmetry Breaker: Refactor de Ciclo de Vida
- **Decisión**: Eliminar definiciones duplicadas de `update`, `draw` y `gameLoop`. Se mantendrá una única instancia limpia dentro del `setup`.
- **Decisión**: El incremento de puntuación se moverá estrictamente a la función `lockTarget`, eliminando cualquier rastro de incremento gradual en el `update`.

## Risks / Trade-offs

- **[Riesgo] Latencia en Arrastre** → Mitigación: Uso de `throttle(50ms)` en el envío de movimientos y transiciones CSS suaves (`transition: all 0.1s linear`) para el cursor remoto y las piezas.
- **[Riesgo] Desincronización de Tablero** → Mitigación: El Host re-sincronizará el estado completo (`BOARD_SYNC`) al inicio de cada nivel de Word Construction y RadarScan.
