## Context

El sistema multijugador presenta problemas de consistencia en el estado de las salas, lo que provoca la acumulación de objetos "zombie" en memoria. En el frontend, RadarScan carece de las mecánicas cooperativas visuales necesarias (punteros remotos) y el buscador de emojis falla al no encontrar coincidencias, además de carecer de localización.

## Goals / Non-Goals

**Goals:**
- Asegurar que un usuario solo pueda existir en una sala a la vez en el backend.
- Eliminar salas vacías inmediatamente.
- Visualizar el cursor de los compañeros en RadarScan.
- Localizar las etiquetas de emojis al catalán y corregir el bug de filtrado.

**Non-Goals:**
- Implementar un sistema de reconexión persistente.
- Añadir un sistema completo de traducción i18n (solo se traducirán las etiquetas de emojis de forma estática).

## Decisions

### 1. Uso del mapa `userToRoom` para exclusividad
**Decisión:** Utilizar el mapa ya existente (o implementarlo si falta consistencia) `userToRoom` en `RoomManager` para verificar la presencia del usuario antes de cualquier acción de entrada.
**Rationale:** Permite una verificación O(1) del estado del usuario sin recorrer todas las salas.

### 2. Renderizado de cursores remotos mediante `v-for`
**Decisión:** En `RadarScan.vue`, iterar sobre `multiplayerStore.remoteCursors` para renderizar componentes de linterna adicionales.
**Rationale:** Es el patrón estándar utilizado en otros minijuegos cooperativos del proyecto y garantiza sincronización reactiva.

### 3. Actualización de constantes de emojis
**Decisión:** Modificar directamente `frontend/web/src/constants/emojis.js` para añadir las etiquetas en catalán dentro de la cadena `tags` de cada emoji.
**Rationale:** Es la forma más rápida y eficiente de soportar búsquedas multilingües sin añadir complejidad técnica al motor de búsqueda.

## Risks / Trade-offs

- **[Risk]** Forzar `leaveRoom` automáticamente podría desconectar a un usuario de una partida legítima si abre una segunda pestaña accidentalmente. → **Mitigation**: Es un comportamiento esperado para mantener la integridad ("un usuario, una sala").
- **[Risk]** Muchos cursores remotos podrían saturar la pantalla. → **Mitigation**: RadarScan está limitado a parejas (2 jugadores), por lo que solo habrá un cursor remoto.
