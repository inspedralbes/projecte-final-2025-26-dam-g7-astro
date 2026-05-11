## ADDED Requirements

### Requirement: Importaciones Correctas de Vue
El componente `RhymeSquad.vue` DEBE importar todas las funciones de Vue que utiliza (`ref`, `computed`, `onMounted`, `watch`, etc.) para evitar errores de referencia en tiempo de ejecución.

#### Scenario: Referencia a Computed
- **WHEN** el componente `RhymeSquad.vue` es cargado por el navegador
- **THEN** la función `computed` debe estar disponible y no lanzar un error `ReferenceError: computed is not defined`

### Requirement: Acceso Seguro a Estado de Sala
Todos los accesos a propiedades del objeto `multiplayerStore.room` dentro de los componentes de juego DEBEN utilizar encadenamiento opcional (`?.`) o verificaciones de nulidad previas para evitar excepciones al intentar acceder a propiedades de un objeto no definido.

#### Scenario: Acceso a Host en Fin de Juego
- **WHEN** la función `endGame` es llamada en `RhymeSquad.vue`
- **THEN** el sistema debe verificar de forma segura si el usuario es el host (`multiplayerStore.room?.host`) sin crashear si la sala ya no existe.

### Requirement: Variantes de Vuetify Válidas
El uso de componentes Vuetify DEBE adherirse a las variantes soportadas por la biblioteca (`flat`, `text`, `elevated`, `tonal`, `outlined`) para evitar advertencias de consola y comportamientos inesperados.

#### Scenario: Variante Outlined en Card de Lobby
- **WHEN** se renderiza un hueco vacío en `MultiplayerLobby.vue`
- **THEN** el componente `<v-card>` debe usar `variant="outlined"` en lugar de la variante no soportada `dashed`.

### Requirement: Estilo Visual Dashed mediante CSS
Para mantener la identidad visual, los elementos que anteriormente usaban la variante `dashed` DEBEN implementar este estilo mediante una clase CSS estándar que aplique `border-style: dashed`.

#### Scenario: Borde de Guiones en Hueco Vacío
- **WHEN** se aplica la clase `border-dashed` a una tarjeta de Vuetify
- **THEN** el borde de la tarjeta debe mostrarse con una línea de guiones.
