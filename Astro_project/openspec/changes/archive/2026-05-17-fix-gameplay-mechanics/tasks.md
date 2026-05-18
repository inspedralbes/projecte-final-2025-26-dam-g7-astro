## 1. Ajustes en el Juego de la Radio (RadioSignal.vue)

- [x] 1.1 Implementar interpolación progresiva (damping) en la frecuencia mediante un bucle de animación con requestAnimationFrame.
- [x] 1.2 Remover las transiciones CSS de 0.05s en la perilla (.knob-body) y el indicador (.dial-indicator) para evitar conflictos.
- [x] 1.3 Diseñar un debounce con temporizador para bloquear la frecuencia correcta sólo cuando se estabilice por 700ms o se suelte la perilla de arrastre.

## 2. Ajustes en el Spelled Rosco (SpelledRosco.vue)

- [x] 2.1 Modificar la condición de rosco completado para sumar +20 segundos de bonificación adicionales al temporizador general del jugador, permitiéndole continuar a una nueva ronda de palabras.

## 3. Ajustes en el Escuadrón de Rimas (RhymeSquad.vue)

- [x] 3.1 Agregar la línea límite visual discontinua de neón rojo en la parte inferior de la pantalla a 570px de altura.
- [x] 3.2 Cambiar la constante de eliminación y colisión del juego de 650px a 570px para disparar el daño y remoción en la barrera límite.
- [x] 3.3 Corregir la deformación/jitter de hover en las burbujas escalando únicamente el elemento interno .word-bubble.

## 4. Ajustes en el Juego de las Sílabas (SyllableQuest.vue)

- [x] 4.1 Definir la función triggerFeedback en el script de SyllableQuest.vue para solventar el bloqueo del flujo de juego en un jugador.
- [x] 4.2 Actualizar el condicional de renderizado del minijuego para asegurar que en multijugador 1vs1, duelos, carreras y torneos se juegue al modo clásico de contar sílabas.
