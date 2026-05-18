## Why

Este cambio se enfoca en resolver varios problemas de usabilidad, fluidez y jugabilidad identificados por el usuario en cuatro minijuegos: Radio (RadioSignal.vue), Rosco (SpelledRosco.vue), Escuadrón de Rimas (RhymeSquad.vue) y Sílabas (SyllableQuest.vue). Estos ajustes permitirán una experiencia mucho más divertida, pulida y justa tanto en el modo un jugador como en multijugador 1vs1.

## What Changes

- **Juego de la Radio (RadioSignal.vue)**:
  - **Suavizado de Control**: El dial rotatorio ahora se moverá de forma suave y amortiguada (damping) en lugar de saltar bruscamente con la posición absoluta del cursor, mejorando drásticamente el "feeling" analógico.
  - **Bloqueo y Feedback Retardado**: La señal de transmisión no se "bloqueará" (isTuned = true) ni reproducirá el audio de forma instantánea al pasar por la frecuencia correcta si el usuario sigue rotando rápidamente el dial. Esperará a que el dial esté en reposo (de-bounce) o a que el usuario suelte el botón de arrastre.
- **Spelled Rosco (SpelledRosco.vue)**:
  - **Bono de Tiempo por Rosco Completado**: Completar el rosco completo sumará un bono de +20 segundos al temporizador del jugador, incluso si el jugador cometió algún fallo en las respuestas (todas las letras procesadas).
- **Escuadrón de Rimas (RhymeSquad.vue)**:
  - **Indicador Visual del Límite de Rimas**: Se añade una línea de límite dashed/neon roja al final de la pantalla (y = 570px) indicando la barrera protectora donde las rimas deben atraparse antes de cruzarla.
  - **Colisión con el Límite**: Si una rima correcta cruza la línea límite, se restará una vida/causará daño y se eliminará la palabra, evitando que se pierda la vida de forma invisible en la parte inferior cortada.
  - **Solución al Jitter de Hover**: Se corrige el escalado en hover del bubble de la rima que causaba un efecto tembloroso incómodo y molesto.
- **Juego de las Sílabas (SyllableQuest.vue)**:
  - **Corrección de Avance y Feedback en Single Player**: Se soluciona el fallo en el que el juego no avanzaba de palabra al acertar y no notificaba al usuario debido a la ausencia del helper `triggerFeedback` en el script.
  - **Estabilización de Multijugador 1vs1**: Se corrige el condicional de renderizado y sincronización para que el modo 1vs1 de sílabas sea el modo competitivo clásico de contar sílabas (en lugar del modo cooperativo de ordenar frases).

## Capabilities

### New Capabilities

- `gameplay-fixes`: Capacidad de calibrar, depurar y mejorar las mecánicas de interacción, visualización y lógica de juego en los minijuegos del ecosistema Astro.

### Modified Capabilities

*(Ninguna capability existente modificada)*

## Impact

Este cambio afecta únicamente a los componentes compartidos de los minijuegos en la capa de frontend:
- [RadioSignal.vue](file:///c:/Users/pulpo/OneDrive/Escritorio/projecte-final-2025-26-dam-g7-astro/Astro_project/frontend/web/src/modes/shared/minigames/RadioSignal.vue)
- [SpelledRosco.vue](file:///c:/Users/pulpo/OneDrive/Escritorio/projecte-final-2025-26-dam-g7-astro/Astro_project/frontend/web/src/modes/shared/minigames/SpelledRosco.vue)
- [RhymeSquad.vue](file:///c:/Users/pulpo/OneDrive/Escritorio/projecte-final-2025-26-dam-g7-astro/Astro_project/frontend/web/src/modes/shared/minigames/RhymeSquad.vue)
- [SyllableQuest.vue](file:///c:/Users/pulpo/OneDrive/Escritorio/projecte-final-2025-26-dam-g7-astro/Astro_project/frontend/web/src/modes/shared/minigames/SyllableQuest.vue)
