## Context

Actualmente, la validación de vidas para el modo Boss se realiza directamente en el componente `MultiplayerLobby.vue` mediante lógica imperativa que busca el item con ID 1 en el store de inventario. Esta lógica se repite en dos lugares: al cambiar la modalidad y al iniciar la partida. Centralizar esta lógica en el `multiplayerStore.js` permite una mejor separación de responsabilidades y facilita futuras modificaciones (por ejemplo, si cambia el ID del item o el requisito de cantidad).

## Goals / Non-Goals

**Goals:**
- Centralizar la lógica de validación de requisitos para el Modo Boss en `multiplayerStore.js`.
- Refactorizar `MultiplayerLobby.vue` para que sea un consumidor pasivo de esta validación.
- Asegurar que el host no pueda iniciar una partida de Boss sin cumplir los requisitos.

**Non-Goals:**
- Cambiar la lógica de consumo de vidas en el backend.
- Modificar el sistema de inventario o la tienda.
- Añadir nuevos modos de juego.

## Decisions

- **Implementar un Getter en `multiplayerStore.js`**: Se creará un getter llamado `hasBossRequirements` (o similar) que acceda a `useInventoryStore` para verificar las vidas.
  - *Rationale*: Los getters son reactivos y se actualizan automáticamente cuando cambia el inventario, lo que los hace ideales para validaciones de UI.
- **Implementar una Acción de Validación en `multiplayerStore.js`**: Se creará una acción `validateBossAccess()` que devuelva un objeto `{ valid: boolean, message: string }`.
  - *Rationale*: Una acción permite centralizar también el mensaje de error localizado, evitando duplicación de strings en la UI.
- **Refactorización de `MultiplayerLobby.vue`**: Sustituir la búsqueda manual `.find(item => item.id === 1)` por llamadas al store.

## Risks / Trade-offs

- **[Risk]** Dependencia circular entre stores si no se maneja correctamente el acceso a `inventoryStore` desde `multiplayerStore`.
  - **Mitigation**: Importar y usar `useInventoryStore()` dentro del getter o acción, no en el top-level del archivo si es posible, o asegurar que Pinia ya esté inicializado.
- **[Trade-off]** Mover lógica de UI al store aumenta ligeramente el tamaño del store, pero la ganancia en mantenibilidad y testabilidad lo compensa.
