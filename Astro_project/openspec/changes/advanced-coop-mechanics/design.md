## Context

El proyecto busca mejorar la jugabilidad cooperativa en tres mini-juegos: SpelledRosco, Radio Signal y RhymeSquad. Actualmente, estos juegos tienen mecánicas básicas que pueden ser expandidas para fomentar una colaboración más estrecha entre los jugadores. El trabajo se limitará exclusivamente al frontend (Vue.js) y la gestión de estado con Pinia (`multiplayerStore`).

## Goals / Non-Goals

**Goals:**
- Implementar pistas inteligentes en SpelledRosco (Categoría y Tipo de palabra).
- Rediseñar el selector de emojis para que sea más funcional y organizado.
- Eliminar restricciones de tiempo y añadir interactividad (chat cruzado) en Radio Signal.
- Sincronizar roles y acciones en tiempo real en RhymeSquad.
- Aumentar la dificultad en modos cooperativos de RhymeSquad.

**Non-Goals:**
- Modificar el backend o el protocolo de red. Se deben usar los eventos existentes (`GAME_ACTION`).
- Añadir nuevos mini-juegos.
- Cambiar la lógica de puntuación global.

## Decisions

### 1. SpelledRosco Intelligence
- **Pistas**: Se creará una utilidad `roscoHints.js` que reciba `currentLetter.answer`. 
    - **Categoría**: Mapeo manual para palabras clave o una categoría por defecto "GENERAL".
    - **Tipo**: Lógica basada en sufijos (-ar, -er, -ir para verbos; -mente para adverbios; etc.).
- **Emoji Picker**: Se agrupará `EMOJI_LIBRARY` por categorías. La UI usará un sistema de pestañas (Tabs) en la parte superior/inferior para filtrar la lista mostrada.

### 2. Radio Signal Cross-Transmission
- **Intercambio de datos**: Los componentes leerán los datos del compañero desde el estado de la sala. El Jugador A verá la "targetPhrase" asignada al Jugador B y viceversa.
- **Mini-chat**: Se enviarán mensajes de texto usando `sendGameAction({ type: 'RADIO_CHAT', text: '...' })`. El componente escuchará `lastMessage` de `multiplayerStore`.

### 3. RhymeSquad Role Sync
- **Roles**: El `subRole` (Catcher o Sniper) determinará los controles activos.
- **Sincronización**:
    - El Sniper enviará su posición de ratón frecuentemente (`MOUSE_MOVE`).
    - Al destruir un meteorito, se enviará `sendGameAction({ type: 'METEOR_DESTROYED', id: '...' })`.
- **Dificultad**: Se ajustarán los parámetros de `spawnRate` y `velocity` condicionalmente si la sala es cooperativa y tiene 2+ jugadores.

## Risks / Trade-offs

- **[Risk] Rendimiento con muchos emojis** → **Mitigación**: Implementar virtualización de listas o carga diferida por categorías.
- **[Risk] Latencia en sincronización de cursores** → **Mitigación**: Usar interpolación simple en el frontend para suavizar el movimiento de los cursores remotos.
- **[Risk] Colisiones duplicadas** → **Mitigación**: Solo el Catcher procesa colisiones de rimas correctas; solo el Sniper procesa clics en meteoritos basura.
