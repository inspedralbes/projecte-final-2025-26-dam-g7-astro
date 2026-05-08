## Why

Existen crasheos críticos y advertencias en el frontend que degradan la experiencia del usuario. Específicamente, falta la importación de `computed` en el componente `RhymeSquad.vue` y se está utilizando una variante de componente no válida (`variant="dashed"`) en `MultiplayerLobby.vue`, lo que provoca errores en la consola y posibles fallos de renderizado.

## What Changes

- **RhymeSquad.vue**:
  - Se añadirá `computed` a las importaciones de `vue`.
  - Se revisarán y asegurarán los accesos a `multiplayerStore.room` utilizando optional chaining (`?.`) donde sea necesario para evitar lecturas de propiedades en `null`.
- **MultiplayerLobby.vue**:
  - Se reemplazará la variante inválida `variant="dashed"` por `variant="outlined"`.
  - Se añadirá una clase CSS personalizada (`border-dashed`) para mantener el estilo visual de guiones mediante CSS estándar.

## Capabilities

### New Capabilities
- `frontend-stability-fixes`: Implementación de correcciones de sintaxis y compatibilidad de componentes para asegurar un entorno frontend sin errores de consola ni crasheos.

### Modified Capabilities
<!-- No requirement changes, only implementation fixes. -->

## Impact

- `frontend/web/src/components/games/RhymeSquad.vue`: Corrección de importaciones y seguridad de tipos.
- `frontend/web/src/pages/friends/MultiplayerLobby.vue`: Limpieza de advertencias de Vuetify y ajuste de estilos CSS.
