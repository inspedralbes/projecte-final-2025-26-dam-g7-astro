## Why

La estructura actual del frontend distribuye los componentes, la lógica y las páginas en carpetas genéricas (pages, components, stores). A medida que el proyecto "Astro" crece con más modos de juego y minijuegos, esta organización dificulta la navegación y el mantenimiento. Agrupar por "modo de juego" permitirá una mejor encapsulación y facilitará que cada modo gestione sus propios recursos.

## What Changes

- **Nueva Estructura de Módulos**: Creación de src/modes para centralizar la lógica de los diferentes tipos de experiencia de juego.
- **Migración de SinglePlayer**: Consolidación de singleplayer.vue y sus componentes en src/modes/training.
- **Migración de Multiplayer**: Consolidación de MultiplayerLobby.vue, los componentes de components/multiplayer y multiplayerStore.js en src/modes/multiplayer.
- **Migración de Educational**: Consolidación de la lógica educativa en src/modes/educational.
- **Centralización de Minijuegos**: Movimiento de los minijuegos compartidos a src/modes/shared/minigames.

## Capabilities

### New Capabilities
- modular-game-modes: Estructura que permite a�adir nuevos modos de juego simplemente creando una nueva subcarpeta en modes.

### Modified Capabilities
- singleplayer-mode: Reubicado para mayor coherencia.
- multiplayer-mode: Reubicado y desacoplado de la carpeta riends.

## Impact

- **Frontend**: Reestructuración masiva de carpetas y actualización de todos los imports en componentes, páginas y el router. No deber�a haber cambios en la lógica funcional, solo organizativos.
