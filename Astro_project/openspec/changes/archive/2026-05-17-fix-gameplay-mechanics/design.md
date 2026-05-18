## Context

El usuario reportó varios fallos e incomodidades en los minijuegos en el frontend de Astro:
1. En **RadioSignal.vue**, el dial rotatorio cambia de forma demasiado abrupta con el ángulo absoluto del ratón, y la sintonización se bloquea instantáneamente reproduciendo alertas erróneas al pasar rápido.
2. En **SpelledRosco.vue**, completar un rosco no añade tiempo extra.
3. En **RhymeSquad.vue**, las palabras se caen de forma invisible sin una línea visual límite que indique cuándo se pierde una vida, y el escalado en hover del bubble causa temblores (jitter).
4. En **SyllableQuest.vue**, la versión de un jugador tiene un error en `checkSyllables()` que frena la propagación del flujo de juego debido a la llamada a la función inexistente `triggerFeedback()`, y el modo multijugador 1vs1 muestra la interfaz cooperativa de ordenar frases en lugar del juego competitivo de sílabas.

## Goals / Non-Goals

**Goals:**
- Implementar interpolación lineal suave (damping) en la sintonización y rotación del dial de RadioSignal.vue.
- Diseñar un mecanismo de debounce / retraso de sintonización que valide que el dial esté estable en la frecuencia correcta por al menos 700ms o se haya soltado el botón de arrastre.
- Programar un bono de +20 segundos en el Rosco tras procesar el 100% de las letras (sea con aciertos o errores).
- Agregar una barrera láser visual dashed roja en RhymeSquad.vue y usar `y = 570` como el límite físico de colisión y daño.
- Corregir el bug de hover en RhymeSquad.vue escalando el elemento hijo `.word-bubble` en lugar de `.word-bubble-container` para evitar colisiones de transformaciones CSS.
- Definir e integrar la función `triggerFeedback` en SyllableQuest.vue para arreglar el flujo de un jugador.
- Re-diseñar el condicional de SyllableQuest.vue para renderizar la pantalla clásica de contar sílabas en multijugador 1vs1, duelos, carreras y torneos.

**Non-Goals:**
- Rediseñar el motor de físicas de RhymeSquad.
- Cambiar la comunicación de red WebSocket en el servidor backend.
- Modificar el sistema de base de datos o almacenamiento persistente de puntuaciones.

## Decisions

### 1. Damping en Radio Dial
- **Elección**: Usar un bucle de animación con `requestAnimationFrame` que suavice progresivamente `currentFrequency` hacia `targetCurrentFrequency` usando un factor de damping de `0.15` (o `0.03` si se aplica el efecto de congelación del jefe).
- **Razón**: Permite una respuesta analógica sumamente agradable y fluida al usuario, eliminando los molestos saltos bruscos. También removemos las transiciones CSS de 0.05s linear en `.knob-body` y `.dial-indicator` para evitar interferencias.

### 2. Debounce en Tuning Lock
- **Elección**: Almacenar un temporizador `tuningTimeout` de 700ms. Si la frecuencia está en el rango correcto, se bloquea instantáneamente si el usuario no está arrastrando el dial (`!isDraggingKnob`). Si está arrastrando, se limpia y redefine el temporizador para activarlo sólo cuando el dial se estabilice o se suelte (`stopRotating`).
- **Razón**: Evita activaciones accidentales "fantasma" al arrastrar la perilla rápidamente a través del espectro.

### 3. Rosco Bonus
- **Elección**: Aumentar `timeLeft.value += 20` dentro del bloque de completado de rosco (donde `loops >= roscoLetters.value.length`) en SpelledRosco.vue.
- **Razón**: Añade dinamismo, recompensando al jugador con tiempo para seguir jugando nuevas rondas.

### 4. Límite Láser en Rimas
- **Elección**: Agregar una etiqueta `div.boundary-line` de altura de línea absoluta en `y = 570px` con un borde rojo discontinuo y sombra de brillo de neón. En la lógica de `gameTick`, cambiar la constante de colisión `limit` de 650 a 570.
- **Razón**: Visibilidad clara del punto de "no retorno" para el jugador, mejorando notablemente la jugabilidad.

### 5. Hover en Burbujas de Rimas
- **Elección**: Modificar el selector CSS `.word-bubble-container:hover` a `.word-bubble-container:hover .word-bubble` para escalar sólo la burbuja interna.
- **Razón**: El contenedor absoluto tiene un transform inline (`translateX(-50%)`). CSS intentaría invalidar o combinar transforms, causando jitter. Escalar el hijo interno evita este conflicto de forma elegante.

### 6. Función triggerFeedback en Sílabas
- **Elección**: Definir localmente `triggerFeedback(type)` en SyllableQuest.vue, inicializando un objeto de audio `new Audio(sounds[type])`, estableciendo `showFeedback.value = true` y ocultándolo con un temporizador tras 600ms.
- **Razón**: La función se invocaba pero no existía en el archivo, lo que causaba un error fatal y bloqueaba el avance.

### 7. Sílabas 1vs1 Clásico
- **Elección**: Actualizar la directiva `v-if` en SyllableQuest.vue para renderizar la pantalla clásica competitiva si:
  `!isMultiplayer || props.isDuel || props.isRace || (multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT') || (multiplayerStore.room?.gameConfig?.modality === '1vs1')`
- **Razón**: Garantiza que el juego de contar sílabas mantenga su jugabilidad competitiva y sincrónica original en cualquier modalidad 1vs1.

## Risks / Trade-offs

- *Riesgo*: Diferentes resoluciones de pantalla podrían alterar ligeramente la visualización de la línea límite en RhymeSquad.
  *Mitigación*: La línea límite se posiciona de forma absoluta dentro del contenedor `.play-area` que tiene una altura fija garantizada de `650px`, lo que asegura consistencia total.
