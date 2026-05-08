## Context

El frontend de la aplicación utiliza Vue 3 con Composition API y Vuetify para los componentes de la interfaz de usuario. Se han detectado errores de ejecución debido a importaciones faltantes y el uso de propiedades de componentes que no existen en la versión actual de Vuetify, lo que genera ruido en la consola y crasheos en el flujo de juego multijugador.

## Goals / Non-Goals

**Goals:**
- Resolver el `ReferenceError` por falta de `computed` en `RhymeSquad.vue`.
- Asegurar que `RhymeSquad.vue` no falle si la sala de multijugador se cierra inesperadamente.
- Eliminar las advertencias de Vuetify en `MultiplayerLobby.vue`.
- Mantener la estética visual de bordes punteados (dashed) mediante CSS.

**Non-Goals:**
- Refactorizar la lógica completa de los juegos.
- Añadir nuevas funcionalidades al lobby o a los juegos.
- Cambiar la versión de Vuetify o Vue.

## Decisions

- **Decision 1: Importación Explícita de Vue Primitives**: Se añadirá `computed` al bloque de importación de `vue` en `RhymeSquad.vue`. Se prefiere esto sobre el uso de auto-imports para mantener la claridad y compatibilidad con el linter actual.
- **Decision 2: Uso de Optional Chaining para Room**: Se aplicará `multiplayerStore.room?.prop` en todos los puntos críticos de los componentes de juego. Esto evita excepciones de tipo "Cannot read property of null" cuando el socket se desconecta o la sala es destruida.
- **Decision 3: Reemplazo de Variantes de Vuetify**: Cambiar `variant="dashed"` por `variant="outlined"` en `<v-card>`.
- **Decision 4: Implementación de Clase CSS para Bordes**: Se creará una clase `.border-dashed` en el bloque `<style>` de `MultiplayerLobby.vue` que aplique `border-style: dashed !important`. Se utilizará `!important` si es necesario para sobrescribir los estilos base de Vuetify de forma segura.

## Risks / Trade-offs

- **[Riesgo]** La clase CSS `border-dashed` podría no alinearse perfectamente con el radio de borde (`border-radius`) de Vuetify.
  - **[Mitigación]** Se verificará visualmente y se ajustará el padding/border-radius si es necesario.
- **[Riesgo]** El uso de optional chaining podría ocultar errores lógicos subyacentes donde la sala *debería* existir.
  - **[Mitigación]** Se añadirán logs de advertencia si se detecta que la sala es nula en estados donde se espera que esté presente.
