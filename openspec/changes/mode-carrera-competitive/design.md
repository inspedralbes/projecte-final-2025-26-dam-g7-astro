## Context

Astro Project ya cuenta con una infraestructura multijugador basada en WebSockets (`multiplayerStore.js`) y una colección de minigames. El "Mode Carrera" requiere una capa superior que gestione la secuencia de estos juegos y añada mecánicas de supervivencia (combustible) y obstáculos dinámicos (anomalías).

## Goals / Non-Goals

**Goals:**
- Implementar una carrera 1v1 simultánea donde ambos jugadores ven el progreso del rival.
- Crear un sistema de combustible que actúe como temporizador de supervivencia.
- Añadir anomalías visuales e interactivas que afecten la jugabilidad.
- Garantizar que la lógica sea 100% frontend, minimizando cambios en el backend.

**Non-Goals:**
- No se implementarán equipos (2vs2) por ahora, centrándose en el 1v1 competitivo.
- No se modificarán las reglas internas de los minijuegos existentes, solo cómo se encadenan.

## Decisions

- **Sync de Progreso**: Se enviará un mensaje `RACE_PROGRESS` vía WebSocket cada vez que un jugador complete un minijuego. La barra superior se actualizará basándose en el índice del juego actual de cada jugador.
- **Quantum Fuel**: Se gestionará localmente en el store. Bajará a una tasa constante (ej. 1% por segundo) y se recuperará un % fijo al ganar un juego.
- **Componente de Anomalías**: Se creará `GlobalAnomalyManager.vue` que se montará sobre el área de juego. Usará `v-if` y clases dinámicas para aplicar efectos como `nebulosa` (blur/overlay) o `raig-alienigena` (cursor scaling).
- **Lluvia de Meteoritos**: Se implementará usando una animación CSS o un canvas ligero. Se detectará la colisión del cursor con los meteoritos mediante `mouseenter` en los elementos móviles, activando un estado `lockdown` que desactiva clics por 2 segundos.
- **Lobby**: Se añadirá un selector de "Modo de Juego" en la configuración de la sala que, al elegir "Carrera", habilitará la secuencia de juegos y las reglas de combustible.

## Risks / Trade-offs

- **Latencia**: La barra de progreso del rival puede tener un pequeño retraso, pero al ser una carrera simultánea "sin turnos", no afecta la jugabilidad individual.
- **Trampas**: Al ser 100% frontend, un usuario avanzado podría manipular el combustible en memoria. Se asume un entorno de juego amistoso o controlado por ahora.
- **Interferencia de Anomalías**: Algunas anomalías podrían hacer que ciertos minijuegos sean casi imposibles. Se ajustará la probabilidad y duración para que sea un reto, no una frustración.
