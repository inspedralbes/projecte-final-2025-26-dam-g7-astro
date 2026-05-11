## ADDED Requirements

### Requirement: Acceso Seguro al Estado de la Sala (Failsafe)
Todos los componentes que consuman el estado `multiplayerStore.room` DEBEN utilizar encadenamiento opcional para cualquier propiedad anidada.

#### Scenario: Acceso a gameConfig
- **WHEN** un componente intenta acceder a `multiplayerStore.room.gameConfig`
- **THEN** debe utilizarse la sintaxis `multiplayerStore.room?.gameConfig` para evitar errores si `room` es null.

### Requirement: Importaciones Explícitas de Primitivas Vue
Los componentes DEBEN importar explícitamente `computed`, `ref`, `watch`, `onMounted` y `onUnmounted` desde el paquete `vue`.

#### Scenario: Uso de Computed
- **WHEN** el desarrollador utiliza `computed()` en el script setup
- **THEN** la importación correspondiente debe estar presente en el bloque de imports de `vue`.

### Requirement: Compatibilidad de Variantes de Vuetify
Ningún componente de Vuetify debe utilizar la variante `dashed`. En su lugar, se debe usar `outlined` con una clase CSS que aplique el estilo de guiones.

#### Scenario: Borde punteado en Card
- **WHEN** se requiere un borde punteado en un `<v-card>`
- **THEN** se debe aplicar `variant="outlined"` y la clase CSS `border-dashed`.
