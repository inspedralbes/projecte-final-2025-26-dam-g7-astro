## Context

El modo cooperativo 2vs2 requiere que los componentes de Vue del frontend y la lógica del backend del WebSocket se sincronicen de manera instantánea y robusta. Actualmente, la falta de coordinación en tiempo real provoca fallos en las mecánicas clave (como doble linterna, caída sincronizada, cursores dobles y paso de mensajes).

## Goals / Non-Goals

**Goals:**
- Sincronizar de forma bidireccional los eventos de juego para RadarScan, RhymeSquad, WordConstruction, SymmetryBreaker, RadioSignal y SpelledRosco en cooperativo.
- Garantizar que ambos jugadores operen en el mismo canvas/tablero visual compartido.
- Implementar renderizado de doble cursor y celdas coordinadas de manera fluida y de alto rendimiento.

**Non-Goals:**
- Modificar el sistema de torneos ni el de duelos individuales.
- Alterar la lógica básica de puntuación al final de la partida.

## Decisions

### 1. Mensajería de Acción de Juego Ligera a través de `GAME_ACTION`
Para evitar sobrecargar la conexión de red, usaremos mensajes ligeros del tipo `GAME_ACTION` manejados en `RoomManager.js` que el servidor simplemente retransmite de forma selectiva al compañero de equipo de la sala.

* **Radar Scan**:
  - Acción `RADAR_LIGHT_MOVE`: Transmite `{ x, y }` de la linterna.
  - Acción `RADAR_CELL_REVEAL`: Transmite el índice de la celda pulsada.
* **Rhyme Squad**:
  - Acción `RHYME_SPAWN_TRIGGER`: Sincroniza la semilla y el índice de las palabras cayendo desde el host al cliente.
* **Word Construction**:
  - Acción `WORD_LETTER_MOVE`: Sincroniza el array ordenado de letras y el estado de la palabra.
  - Acción `WORD_CURSOR_MOVE`: Transmite `{ x, y }` del cursor.
* **Symmetry Breaker**:
  - Acción `SYMMETRY_CURSOR_MOVE`: Transmite `{ x, y }` del cursor.
  - Acción `SYMMETRY_TILE_HOVER`: Transmite la baldosa seleccionada para comprobar coincidencia simultánea en tiempo real.
* **Radio Signal**:
  - Acción `RADIO_TRANSMIT_PHRASE`: Transmite el texto de la transcripción enviada por el Oyente.
* **Spelled Rosco**:
  - Acción `ROSCO_CLUE_SUBMIT`: Transmite la definición enviada en tiempo real por el Emisor al Adivinador.

### 2. Estética Singleplayer en WordConstruction y RadioSignal
- Revertir los diseños frontales de ambos juegos eliminando componentes ad-hoc de "cooperación obligatoria" y restaurando la visualización clásica y fluida que ya funcionaba en versiones previas.
- Añadir un simple cuadro de input/chat flotante en `RadioSignal.vue` para el rol de Oyente que envíe el mensaje al Escritor a través de la acción `RADIO_TRANSMIT_PHRASE`.

## Risks / Trade-offs

- **[Riesgo]**: Lag o latencia de red al enviar el movimiento del cursor en tiempo real.
  - **Mitigación**: Usar un *throttle* de 30-50ms en el frontend antes de enviar eventos de movimiento de ratón para reducir el número de mensajes WebSocket y evitar lagazos.
- **[Riesgo]**: Acciones duplicadas al pulsar la misma celda.
  - **Mitigación**: Añadir un bloqueo local temporal de 200ms al interactuar con una celda que ya está en proceso de revelación.
