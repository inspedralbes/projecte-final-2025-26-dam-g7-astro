## Why

Actualmente, el Modo Boss en el multijugador requiere que los jugadores tengan "Packs de Vidas" (ID 1) en su inventario para participar, ya que estas vidas se consumen durante el combate. Aunque ya existen validaciones en la interfaz de usuario (`MultiplayerLobby.vue`), estas están dispersas y dependen del estado local del componente. Centralizar esta validación en el `multiplayerStore` mejora la robustez del sistema, facilita el mantenimiento y asegura que las reglas de negocio se apliquen consistentemente independientemente de la vista.

## What Changes

- **Centralización de la Lógica**: Se implementará un getter o acción en `multiplayerStore` que encapsule la validación de vidas para el Modo Boss.
- **Refactorización de UI**: Se actualizará `MultiplayerLobby.vue` para utilizar la lógica centralizada del store en lugar de realizar búsquedas manuales en el inventario.
- **Bloqueo Preventivo**: Mejora del feedback al usuario cuando intenta seleccionar o iniciar el modo sin las vidas necesarias, utilizando el estado centralizado.

## Capabilities

### New Capabilities
- `boss-mode-validation`: Nueva lógica de validación centralizada para el acceso y ejecución del modo Boss basada en el inventario del usuario.

### Modified Capabilities
<!-- No se modifican requerimientos funcionales existentes, solo se refactoriza la implementación para ser más robusta. -->

## Impact

- **Frontend Stores**: `multiplayerStore.js` recibirá nueva lógica de validación.
- **Frontend Components**: `MultiplayerLobby.vue` será modificado para consumir la nueva validación.
- **User Experience**: Mayor consistencia en los mensajes de error y validación de acceso al modo Boss.
