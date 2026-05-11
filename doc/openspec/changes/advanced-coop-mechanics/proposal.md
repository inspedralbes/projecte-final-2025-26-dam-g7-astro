## Why

El objetivo es profundizar en la experiencia cooperativa del juego, transformando los modos multijugador existentes en experiencias más interactivas, coordinadas y visualmente atractivas. Actualmente, algunos modos carecen de una comunicación fluida o de roles diferenciados que justifiquen plenamente el juego en equipo.

## What Changes

- **SpelledRosco Intelligence**: Introducción de pistas dinámicas (Categoría y Tipo de palabra) para el 'guesser' y un selector de emojis categorizado al estilo de aplicaciones de mensajería modernas.
- **Radio Signal Cross-Transmission**: Rediseño de la mecánica de transmisión donde los jugadores intercambian información crítica y se comunican a través de un chat de texto integrado.
- **RhymeSquad Role Sync**: División clara de roles entre 'Catcher' (nave) y 'Sniper' (destrucción de obstáculos) con sincronización visual de punteros y destrucción instantánea de elementos.
- **Equilibrio Cooperativo**: Ajuste de dificultad (velocidad y densidad) para el modo 2vs2 en RhymeSquad.

## Capabilities

### New Capabilities
- `spelledrosco-hints`: Pistas de categoría y tipo de palabra derivadas del diccionario local o terminaciones.
- `emoji-picker-pro`: Selector de emojis avanzado con navegación por categorías.
- `radio-signal-cross-transmission`: Mecánica de intercambio de frases y frecuencias entre jugadores.
- `radio-signal-mini-chat`: Chat de texto integrado en la interfaz de la radio.
- `rhymesquad-role-sync`: Sincronización de roles Catcher/Sniper y visualización de cursores remotos.

### Modified Capabilities
<!-- No hay capacidades existentes registradas en openspec/specs -->

## Impact

- **Frontend (Vue)**: Modificación de componentes de juego (`SpelledRosco.vue`, `RadioSignal.vue`, `RhymeSquad.vue`), `multiplayerStore.js` y utilidades de emojis.
- **UX/UI**: Rediseño de selectores y adición de elementos visuales (chips, cursores remotos, mini-chat).
- **Network**: Mayor tráfico de eventos genéricos en el store de multijugador para sincronizar chats y posiciones de punteros.
