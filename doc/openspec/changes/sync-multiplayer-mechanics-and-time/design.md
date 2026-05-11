## Context

El sistema multijugador utiliza un modelo de comunicación basado en WebSockets donde el Host tiene cierta autoridad sobre el estado inicial, pero los clientes manejan gran parte de la lógica de juego de forma local. Actualmente, esto ha llevado a:
- Divergencias visuales en `WordConstruction`.
- Fallos de progresión en `RadarScan` debido a una lógica de objetivos independientes por jugador.
- Congelación del tiempo cuando la pestaña del navegador pierde el foco, ya que los `setInterval` se ralentizan o detienen.

## Goals / Non-Goals

**Goals:**
- Unificar la experiencia visual y mecánica entre los modos individual y multijugador.
- Garantizar que el tiempo de juego sea consistente para todos los participantes, independientemente del estado de su navegador.
- Implementar una mecánica de cooperación real en RADARSCAN (objetivo compartido).
- Suavizar la representación de compañeros mediante cursores reactivos y precisos.

**Non-Goals:**
- Refactorizar el sistema completo de WebSockets.
- Añadir nuevos minijuegos.
- Cambiar la lógica de puntuación global de la partida.

## Decisions

### 1. Sincronización de RADARSCAN (Dual-Click)
- **Decisión**: El Host generará un único `targetIndex` en `BOARD_SYNC`. Cada cliente rastreará localmente si él mismo ha clicado el objetivo y enviará un mensaje `RADAR_CLICK`.
- **Rationale**: Asegura que el juego sea verdaderamente cooperativo.
- **Alternativa**: Mantener objetivos separados pero sincronizar el progreso. Se descartó por ser menos "cooperativo" y más "carrera paralela".

### 2. Protocolo de Tiempo Anti-Tab-Freeze
- **Decisión**: Al iniciar el juego, el Host capturará `startTime = Date.now()`. En cada frame o intervalo, `timeLeft` se calculará como `duration - (Date.now() - startTime)`.
- **Rationale**: `Date.now()` es independiente de la frecuencia de ejecución del bucle de eventos, lo que evita el desfase por inactividad de pestaña.
- **Alternativa**: Usar Web Workers para el timer (que no se congelan). Se descartó por complejidad innecesaria frente a la solución de marcas de tiempo.

### 3. Snap-back en Word Construction
- **Decisión**: Almacenar las coordenadas `originalX` y `originalY` de cada ficha al generarlas. Si `checkDrop` no encuentra un slot válido en `onMouseUp`, se disparará una transición CSS hacia las coordenadas originales.
- **Rationale**: Mejora el UX al evitar que las fichas queden "perdidas" en zonas muertas del tablero.

### 4. Cursores Remotos Suaves
- **Decisión**: Usar coordenadas normalizadas de 0 a 1000 en el backend y convertirlas a porcentajes (`left: X/10%`) en el frontend. Añadir `transition: all 0.05s linear` al CSS de `.remote-cursor`.
- **Rationale**: Los porcentajes eliminan la dependencia de la resolución de pantalla. La transición suaviza el salto entre paquetes de red recibidos cada 50ms.

## Risks / Trade-offs

- **[Riesgo]** Latencia de red en la doble confirmación de RADARSCAN.
  - **Mitigación**: Mostrar feedback visual inmediato (cambio de color) en el cliente local cuando clica, incluso antes de recibir la confirmación del compañero.
- **[Riesgo]** El Host se desconecta y el tiempo se pierde.
  - **Mitigación**: El `RoomManager` en el backend ya maneja la migración de Host; el nuevo Host puede re-emitir una marca de tiempo de referencia si es necesario.
