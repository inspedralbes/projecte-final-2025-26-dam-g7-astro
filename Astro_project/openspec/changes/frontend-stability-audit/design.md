## Context

Se han reportado crasheos en el frontend durante partidas multijugador, identificados como errores de referencia nula al acceder a la sala. Aunque se han aplicado correcciones puntuales en `RhymeSquad` y el `Lobby`, es necesario extender estas medidas a todos los componentes de juego para garantizar la estabilidad total.

## Goals / Non-Goals

**Goals:**
- Eliminar todos los accesos directos (unsafe) a `multiplayerStore.room`.
- Corregir importaciones de Vue faltantes en componentes de juego.
- Estandarizar el uso de `border-dashed` en lugar de la variante `dashed` de Vuetify.

**Non-Goals:**
- Modificar la lógica de juego o reglas de negocio.
- Rediseñar los componentes visuales más allá de los bordes.

## Decisions

- **Decision 1: Auditoría y Refactorización de Room Access**: Se realizará una búsqueda y reemplazo masivo de `multiplayerStore.room.` por `multiplayerStore.room?.` en todo el directorio de componentes de juego.
- **Decision 2: Estilo CSS Compartido**: Aunque cada componente puede definir su bloque de estilo, se recomienda que la clase `.border-dashed` aplique `border-style: dashed !important` para sobreescribir los estilos de Vuetify de forma consistente.

## Risks / Trade-offs

- **[Riesgo]** El encadenamiento opcional podría ocultar errores donde la sala *debería* estar presente.
  - **[Mitigación]** Se mantendrán logs de consola en modo desarrollo para identificar accesos inesperados a salas nulas.
