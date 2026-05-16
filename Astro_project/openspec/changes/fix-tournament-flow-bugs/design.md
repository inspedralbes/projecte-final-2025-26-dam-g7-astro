## Context

El sistema de torneos actual sufre de falta de sincronización entre el servidor y los clientes espectadores, lo que resulta en visualizaciones incorrectas o estáticas. Además, no existe una lógica robusta para manejar empates ni una transición fluida y automática entre las diferentes etapas de la llave del torneo.

## Goals / Non-Goals

**Goals:**
- Asegurar que los espectadores visualicen el mismo minijuego que los participantes.
- Implementar la mecánica de "Muerte Súbita" para desempatar partidas de forma emocionante.
- Automatizar el flujo completo del torneo para que progrese sin intervención manual del host tras el inicio inicial.

**Non-Goals:**
- Rediseñar visualmente el componente `TournamentTree.vue`.
- Cambiar la lógica de generación inicial de las llaves (brackets).

## Decisions

- **Sincronización de Componentes por Nombre**: El servidor enviará el ID o nombre del componente del minijuego en el mensaje `MATCH_STARTING`. El frontend usará un componente dinámico (`<component :is="...">`) para montar la vista correcta tanto para jugadores como para espectadores.
- **Estado SUDDEN_DEATH**: En lugar de terminar la ronda al llegar el tiempo a cero, el servidor evaluará las puntuaciones. Si hay empate, cambiará el estado de la sala a `SUDDEN_DEATH`. En este estado, el primer evento de puntuación exitosa (`WORD_SUCCESS`, etc.) determinará al ganador instantáneo.
- **Ciclo de Vida Automatizado**: 
    1. Fin de combate -> El servidor emite el ganador y cambia el estado a `MATCH_RESULTS`.
    2. Tras 3 segundos, el servidor cambia automáticamente a `TOURNAMENT_BRACKETS`.
    3. Todos los clientes ven el árbol actualizado.
    4. Tras 7 segundos en la vista de árbol, el servidor busca el siguiente combate `WAITING` y lo lanza automáticamente (`MATCH_STARTING`).

## Risks / Trade-offs

- [Risk] **Latencia en Muerte Súbita** → [Mitigación] El servidor procesará los aciertos por marca de tiempo (timestamp) si llegan casi simultáneos, aunque en WebSockets el primero en llegar al servidor suele ser el ganador "de facto".
- [Risk] **Espectadores atrapados en juegos viejos** → [Mitigación] El frontend forzará un desmontado de componentes antes de montar el nuevo recibido en `MATCH_STARTING`.
