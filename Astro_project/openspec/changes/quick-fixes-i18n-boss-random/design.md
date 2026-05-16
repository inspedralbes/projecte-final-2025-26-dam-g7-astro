## Context

Se han detectado dos problemas rápidos tras la última implementación de funcionalidades: un error de sintaxis JSON y una lógica de asignación rígida en el modo multijugador.

## Goals / Non-Goals

**Goals:**
- Validar y corregir `en.json`.
- Hacer aleatoria la elección del jefe.

**Non-Goals:**
- Añadir nuevas traducciones.
- Cambiar otras lógicas de sala.

## Decisions

- **Unificación de Claves en JSON**: Se combinarán los contenidos de ambas claves `"shop"` en una sola entrada o se eliminará la redundante si es idéntica/menos completa.
- **Selección Aleatoria con Math.random**: En `RoomManager.js`, utilizaremos `Math.floor(Math.random() * players.length)` para obtener el índice del jefe.

## Risks / Trade-offs

- **Riesgo**: Error al editar un JSON grande manualmente. **Mitigación**: Revisar que no falten comas o llaves tras la eliminación.
- **Riesgo**: Que el jefe sea un jugador que acaba de desconectarse. **Mitigación**: Se realiza sobre `room.players` que es el estado actual de la sala.
