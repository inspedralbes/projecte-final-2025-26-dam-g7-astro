## Why

El modo cooperativo 2vs2 presenta varios fallos de sincronización y diseño que impiden una experiencia de juego fluida y verdaderamente colaborativa. Actualmente, los minigames multijugador no están conectados de manera efectiva para que ambos compañeros compartan el mismo tablero o interactúen de forma sincronizada (ej: falta de doble cursor, linternas individuales no compartidas, palabras que no caen para ambos, o pistas del rosco que no se reciben). Además, cambios estéticos recientes alteraron el diseño original en algunos minijuegos, lo cual descontenta al usuario. Solucionar esto ahora es crítico para garantizar un multijugador premium y divertido para el proyecto final.

## What Changes

- **Word Construction**:
  - Revertir el diseño visual para que sea exactamente idéntico al modo Singleplayer.
  - Habilitar arrastre libre bidireccional de letras para ambos jugadores en cualquier orden.
  - Sincronizar y mostrar el cursor del ratón del compañero en tiempo real.
  - Eliminar el banner superior que aconseja cooperar.
- **Radar Scan**:
  - Sincronizar y renderizar dos linternas en pantalla (una para cada jugador).
  - Ambos jugadores buscan simultáneamente las 2 letras malas del radar en el mismo tablero.
- **Rhyme Squad**:
  - Sincronizar la caída y el comportamiento de las burbujas de palabras para que caigan exactamente igual y al mismo tiempo para ambos jugadores.
- **Symmetry Breaker**:
  - Sincronizar y mostrar el cursor del ratón del compañero.
  - Sumar puntuación únicamente cuando ambos jugadores señalen/hagan clic en el objetivo correcto al mismo tiempo.
- **Radio Signal**:
  - Revertir el diseño y el comportamiento al estado del commit `"modificacions visuals i utilitats per millora"`.
  - Añadir una caja de texto de chat/transmisión rápida para que el oyente (`listener`) pueda transcribir y enviar lo que escucha al escritor (`writer`).
- **Spelled Rosco**:
  - Asegurar la transmisión correcta y la recepción en tiempo real de las definiciones y pistas del emisor (`sender`) al receptor (`guesser`).

## Capabilities

### New Capabilities
- `coop-radar-scan`: Control de dos linternas simultáneas en el mismo tablero de radar para los dos compañeros.
- `coop-rhyme-squad`: Sincronización exacta en tiempo real de burbujas de palabras cayendo para ambos jugadores.
- `coop-word-construction`: Diseño singleplayer con doble arrastre libre bidireccional y cursores remotos sincronizados.
- `coop-symmetry-breaker`: Detección de selección conjunta con doble cursor en pantalla y puntuación simultánea en el objetivo correcto.
- `coop-radio-signal`: Diseño vintage restaurado con caja de transmisión rápida de transcripciones del oyente al escritor.
- `coop-spelled-rosco`: Sincronización y entrega garantizada de pistas del emisor al receptor en tiempo real.

### Modified Capabilities
<!-- No existing capabilities requirements are being modified structurally in openspec/specs -->

## Impact

- **Frontend (`web/src/modes/shared/minigames/`)**: Modificaciones en `RadarScan.vue`, `RhymeSquad.vue`, `WordConstruction.vue`, `SymmetryBreaker.vue`, `RadioSignal.vue`, `SpelledRosco.vue` para soportar cursores remotos, sincronizaciones de eventos WebSocket y flujos cooperativos.
- **Backend (`backend/src/ws/RoomManager.js`)**: Nuevos manejadores de acciones WebSocket de juego (`GAME_ACTION`) para retransmitir movimientos de ratón, posiciones de linterna, caídas sincronizadas y envíos de mensajes rápidos entre compañeros.
