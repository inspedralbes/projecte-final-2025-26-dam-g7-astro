## Context

El sistema actual de minijuegos cooperativos de 2 personas en Astro Project utiliza una lógica heredada de los juegos competitivos por equipos grandes (Rojo vs Azul). Esto causa que en una sala de 4 personas, los jugadores se dividan en dos bandos, pero el sistema no garantiza que jueguen en parejas aisladas de forma efectiva si el juego está diseñado para 1-vs-1 (o pareja-vs-pareja).

Además, el minijuego `SpelledRosco` tiene un selector de emojis estático y muy reducido (40 emojis), lo que limita severamente la capacidad del 'sender' para dar pistas creativas.

## Goals / Non-Goals

**Goals:**
- Agrupar a los jugadores en equipos de 2 (`team-1`, `team-2`, etc.) para juegos cooperativos.
- Asegurar que cada pareja tenga los roles `sender` y `guesser` correctamente asignados.
- Implementar un selector de emojis con buscador y una biblioteca extensa en el frontend.

**Non-Goals:**
- Cambiar la lógica de juegos competitivos (ej. `SymmetryBreaker`).
- Añadir categorías de emojis (solo buscador por texto por ahora para simplificar).
- Modificar el sistema de puntuación global de la sala.

## Decisions

### 1. Reemplazo de 'red'/'blue' por 'team-N' en juegos cooperativos
**Decisión:** En `RoomManager.js`, para juegos que figuran en `isPairGame`, se usarán IDs de equipo dinámicos como `team-${pairIndex + 1}`.
**Rationale:** Permite escalar a más de 2 equipos por sala (ej. 6 jugadores = 3 parejas) sin conflicto con la lógica de bando único.
**Alternativas:** Mantener 'red'/'blue' y añadir un sub-id de pareja, pero es más complejo de gestionar en el broadcast.

### 2. Uso de una lista de emojis nativos extendida
**Decisión:** Integrar una lista estática de aproximadamente 500-1000 emojis comunes con sus nombres/etiquetas en un archivo de constantes.
**Rationale:** Evita la dependencia de bibliotecas pesadas de emoji picker (como `emoji-mart-vue`) que podrían engrosar el bundle y causar problemas de estilo con Vuetify.
**Alternativas:** Usar `emoji-picker-element`, pero la integración con el tema oscuro de la aplicación es más tediosa.

### 3. Filtrado por cliente (Frontend)
**Decisión:** El filtrado se realizará totalmente en el frontend mediante una propiedad computada sobre el input del buscador.
**Rationale:** La lista de emojis es pequeña para los estándares de memoria de un navegador, proporcionando una respuesta instantánea al usuario.

## Risks / Trade-offs

- **[Risk]** Los emojis nativos pueden verse diferentes o no estar disponibles en sistemas operativos antiguos. → **Mitigation**: Usar emojis estándar de Unicode 11.0+ que tienen amplia compatibilidad.
- **[Risk]** La lógica de finalización de ronda podría romperse si espera 'red'/'blue'. → **Mitigation**: Actualizar `RoomManager.js` para que los checks de "equipo terminado" sean agnósticos al nombre del teamId.
