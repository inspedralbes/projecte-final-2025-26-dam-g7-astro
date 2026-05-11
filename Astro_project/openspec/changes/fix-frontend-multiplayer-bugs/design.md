## Context

Se han identificado varios bugs y faltas de pulido en los minijuegos multijugador:
1. **SpelledRosco**: El 'sender' no ve la palabra que debe describir, lo que rompe la mecánica cooperativa.
2. **RadioSignal**: Un cooldown innecesario en el botón de audio frustra a los jugadores rápidos.
3. **RadarScan**: El efecto visual de linterna es inconsistente con el modo un jugador y el modo multijugador oscurece demasiado la pantalla. Además, falta sincronización de clics y dificultad adicional (señuelos).

## Goals / Non-Goals

**Goals:**
- Asegurar que el 'sender' en SpelledRosco siempre vea la palabra correcta.
- Optimizar la respuesta del audio en RadioSignal.
- Unificar y mejorar el efecto visual de linterna en RadarScan para soportar múltiples jugadores.
- Sincronizar eventos de clic en RadarScan y añadir letras señuelo.

**Non-Goals:**
- No se realizarán cambios en el backend. Toda la lógica de sincronización debe basarse en los eventos existentes de `GAME_ACTION` y `ROOM_UPDATE`.

## Decisions

### 1. SpelledRosco: Reactividad de la Palabra
- **Problema**: El componente no está reaccionando correctamente cuando `multiplayerStore.room` se puebla con los datos del rosco.
- **Solución**: Añadir un `watch` sobre `multiplayerStore.room` o sus sub-objetos para refrescar `roscoLetters` cuando los datos lleguen del servidor. Asegurar que `currentLetter` sea reactivo.

### 2. RadioSignal: Reducción de Cooldown
- **Problema**: `window.speechSynthesis.cancel()` seguido de un nuevo `speak` puede tener un retardo percibido o estar limitado por la implementación.
- **Solución**: Eliminar cualquier lógica de `throttle` que pudiera estar afectando indirectamente y asegurar que el botón de reproducción llame a `speakPhrase` de forma inmediata.

### 3. RadarScan: Efecto de Iluminación y Mecánicas
- **Iluminación**: Se sustituirá el sistema de múltiples capas de divs por una única capa de overlay que use `mask-image` con múltiples gradientes radiales concatenados. Esto permite "sumar" las áreas iluminadas sin que se solapen capas negras.
- **Letras Señuelo**: En `generateBoard`, además del `target` y el `distractor`, se seleccionarán 2 letras aleatorias adicionales de un conjunto predefinido para actuar como señuelos.
- **Sincronización**: Cuando un jugador haga clic en una letra (acierto o fallo), se enviará un `GAME_ACTION` tipo `RADAR_CLICK`. El otro jugador escuchará este evento y mostrará el feedback visual (verde/rojo) localmente para mantener la sensación de juego compartido.

## Risks / Trade-offs

- **[Riesgo] Performance en RadarScan**: Renderizar múltiples gradientes radiales dinámicos en un solo estilo puede ser costoso en dispositivos de gama baja.
  - **Mitigación**: Limitar el número de linternas remotas procesadas o simplificar el gradiente si se detectan tirones.
- **[Riesgo] Consistencia de Datos**: Si un jugador recibe el `BOARD_SYNC` con retraso, el clic sincronizado podría fallar.
  - **Mitigación**: Incluir el `index` y el `status` (correcto/incorrecto) en el mensaje de sincronización.
