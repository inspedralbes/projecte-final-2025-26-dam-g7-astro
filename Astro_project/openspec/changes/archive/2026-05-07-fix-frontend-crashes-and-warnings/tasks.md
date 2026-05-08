## 1. Correcciones en RhymeSquad.vue

- [x] 1.1 Añadir `computed` a las importaciones de `vue` en `frontend/web/src/components/games/RhymeSquad.vue`.
- [x] 1.2 Revisar todos los usos de `multiplayerStore.room` en `RhymeSquad.vue` y aplicar encadenamiento opcional `?.` donde falte.

## 2. Correcciones en MultiplayerLobby.vue

- [x] 2.1 Cambiar `variant="dashed"` por `variant="outlined"` en los componentes `<v-card>` de `frontend/web/src/pages/friends/MultiplayerLobby.vue`.
- [x] 2.2 Definir la clase CSS `.border-dashed` en el bloque `<style>` de `MultiplayerLobby.vue`.
- [x] 2.3 Aplicar la clase `border-dashed` a las tarjetas que representan huecos vacíos en el lobby.
- [x] 2.4 Asegurar todos los accesos a `multiplayerStore.room` en el lobby con optional chaining (EXTRA).

## 3. Verificación y Limpieza

- [x] 3.1 Verificar que no hay errores de consola al cargar `RhymeSquad` en modo multijugador.
- [x] 3.2 Confirmar visualmente que los bordes de los huecos vacíos en `MultiplayerLobby` mantienen el estilo punteado.
- [x] 3.3 Ejecutar el linter para asegurar que no se introdujeron errores de estilo.
