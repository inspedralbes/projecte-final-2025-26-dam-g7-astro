## 1. Preparación y Recursos Compartidos

- [x] 1.1 Crear la estructura de directorios en src/modes.
- [x] 1.2 Mover minijuegos de src/components/games a src/modes/shared/minigames.
- [x] 1.3 Actualizar imports de minijuegos compartidos en todo el proyecto.

## 2. Reestructuración de Modo Entrenamiento (SinglePlayer)

- [x] 2.1 Mover src/pages/training/singleplayer.vue a src/modes/training/pages/SinglePlayer.vue.
- [x] 2.2 Evaluar y mover lógica de stroStore.js a src/modes/training/store/ si es viable (o mantener referencia modular).
- [x] 2.3 Actualizar ruta en outer/index.js.

## 3. Reestructuración de Modo Multijugador

- [x] 3.1 Mover src/pages/friends/MultiplayerLobby.vue a src/modes/multiplayer/pages/MultiplayerLobby.vue.
- [x] 3.2 Mover todos los componentes de src/components/multiplayer a src/modes/multiplayer/components/.
- [x] 3.3 Mover src/stores/multiplayerStore.js a src/modes/multiplayer/store/multiplayerStore.js.
- [x] 3.4 Actualizar todos los imports afectados en el nuevo módulo de multijugador.

## 4. Reestructuración de Modo Educativo

- [x] 4.1 Mover src/pages/plans/educational.vue a src/modes/educational/pages/Educational.vue.
- [x] 4.2 Mover src/components/educational/SupplyEditor.vue a src/modes/educational/components/SupplyEditor.vue.

## 5. Verificación y Limpieza

- [x] 5.1 Eliminar carpetas vacías en src/components y src/pages.
- [x] 5.2 Verificar que la aplicación compila sin errores de importación.
- [x] 5.3 Comprobar que las rutas principales (/singleplayer, /multiplayer, /educational) funcionan correctamente.

