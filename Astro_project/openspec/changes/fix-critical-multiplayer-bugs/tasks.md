## 1. RhymeSquad (Anti-Kick Fix)

- [x] 1.1 Modificar la función `endGame` para que solo el Host emita `submitRoundResult`
- [x] 1.2 Actualizar el watcher de `multiplayerStore.lastMessage` para manejar la transición silenciosa en el Guest
- [x] 1.3 Verificar que el Guest no emita `emitExit` prematuramente al finalizar el tiempo local

## 2. Word Construction (Rediseño de Sincronización)

- [x] 2.1 Implementar sistema de coordenadas normalizadas (0-1000) en el tablero
- [x] 2.2 Refactorizar `shuffleCurrentLetters` para que el Host envíe el estado inicial vía `BOARD_SYNC`
- [x] 2.3 Actualizar `onMouseMove` para enviar `ELEMENT_MOVE` con coordenadas normalizadas y throttle
- [x] 2.4 Implementar lógica de Snap sincronizada: al detectar snap local, emitir `ELEMENT_PLACED`
- [x] 2.5 Corregir Z-Index de piezas en arrastre y solucionar duplicación visual de cursores remotos

## 3. RadarScan (Tablero e Iluminación Compartida)

- [x] 3.1 Asegurar que el Host genere el tablero y lo sincronice vía `BOARD_SYNC` al inicio de cada ronda
- [x] 3.2 Implementar la "Linterna Compartida" en `flashlightStyle` usando múltiples gradientes radiales
- [x] 3.3 Configurar `mix-blend-mode` en el overlay de iluminación para sumar luz de ambos jugadores

## 4. Symmetry Breaker (Limpieza y Puntuación)

- [x] 4.1 Eliminar funciones duplicadas de `update`, `draw` y `gameLoop` en el código fuente
- [x] 4.2 Asegurar que el incremento de `score` ocurra exclusivamente dentro de `lockTarget`
- [x] 4.3 Verificar que no existan fugas de memoria por múltiples `requestAnimationFrame`
