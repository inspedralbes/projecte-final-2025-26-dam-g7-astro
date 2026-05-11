## 1. RADARSCAN: Mecánica Cooperativa y Niebla

- [x] 1.1 Modificar `generateBoard` en `RadarScan.vue` para que el Host genere un único `targetIndex` compartido para todo el equipo.
- [x] 1.2 Actualizar el manejo de `BOARD_SYNC` en el `watch` de `multiplayerStore.lastMessage` para sincronizar el objetivo único.
- [x] 1.3 Implementar lógica de doble clic: rastrear quién ha clicado el objetivo y esperar a que ambos jugadores confirmen antes de llamar a `nextRound` o `submitRoundResult`.
- [x] 1.4 Restaurar el efecto visual de niebla (linterna) en el CSS y template de `RadarScan.vue` para paridad visual con el modo individual.

## 2. WORD CONSTRUCTION: Paridad de Interfaz y Snap-back

- [x] 2.1 Sincronizar estilos CSS (colores, sombras, bordes de fichas) de `WordConstruction.vue` con la estética del modo individual.
- [x] 2.2 Modificar el objeto `tile` para almacenar sus coordenadas de origen (`originX`, `originY`) al ser generado o mezclado.
- [x] 2.3 Implementar lógica de "snap-back" en `onMouseUp`: si `checkDrop` no resulta en una letra colocada, la ficha debe volver suavemente a su origen.
- [x] 2.4 Asegurar que los elementos exclusivos de modo individual (como el botón "Barrejar de nou") no interfieran en el flujo multijugador.

## 3. Sincronización de Tiempo (Anti-Tab-Freeze)

- [x] 3.1 Implementar en el Host la captura de `startTime = Date.now()` al iniciar el juego y sincronizarla con el equipo.
- [x] 3.2 Sustituir el decremento simple de `timeLeft--` por un cálculo dinámico basado en `Date.now() - startTime` dentro del `setInterval`.
- [x] 3.3 Asegurar que al recuperar el foco de la pestaña (evento `visibilitychange` o similar), el tiempo se sincronice instantáneamente con la referencia del Host.
- [x] 3.4 Verificar que el tiempo de ronda se detenga correctamente al finalizar la construcción de palabras o encontrar todos los intrusos.

## 4. Cursores y Precisión Visual

- [x] 4.1 Añadir `transition: all 0.05s linear` a la clase `.remote-cursor` en todos los componentes donde se utilice.
- [x] 4.2 Refactorizar el renderizado de cursores para usar siempre porcentajes (`left: x/10%`, `top: y/10%`) basados en coordenadas normalizadas.
- [x] 4.3 Implementar el renderizado de cursores remotos en `RadarScan.vue` (actualmente solo se usan para el foco de luz, no se ve la flecha/icono).
