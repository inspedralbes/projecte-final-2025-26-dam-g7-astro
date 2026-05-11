## Context

El minijuego RadarScan actualmente funciona de forma individual. En modo multijugador, los jugadores compiten por ser los más rápidos en encontrar una letra. El objetivo es transformar esta mecánica en una experiencia cooperativa donde los miembros de un mismo equipo colaboren compartiendo su visión y cumpliendo objetivos individuales que contribuyan al éxito del grupo.

## Goals / Non-Goals

**Goals:**
- Sincronización en tiempo real de las posiciones del ratón entre compañeros de equipo.
- Renderizado de múltiples "linternas" en el frontend para representar la visión compartida.
- Asignación de objetivos únicos por jugador dentro de un equipo.
- Lógica de victoria supeditada a que todos los miembros del equipo completen su tarea.
- Escalabilidad dinámica según el número de jugadores en la sala.

**Non-Goals:**
- Implementar chat de voz o herramientas de comunicación externa.
- Cambiar la lógica de los otros 5 minigames existentes.
- Implementar un sistema de selección manual de equipos (se hará de forma automática/balanceada por ahora).

## Decisions

### 1. Gestión de Equipos en el Backend
Se modificará `RoomManager.js` para que, al iniciar una partida en modo cooperativo, los jugadores sean asignados a un `teamId` (ej. 'red', 'blue'). 
- **Rationale**: Permite agrupar jugadores y filtrar comunicaciones sin cambiar drásticamente la estructura de la sala.

### 2. Filtrado de Eventos WebSocket
Se introducirá el método `broadcastToTeam(roomId, teamId, message)` en el `RoomManager`. Los eventos de tipo `MOUSE_MOVE` solo se enviarán a los miembros del mismo equipo.
- **Rationale**: Reducción de latencia y tráfico de red innecesario para jugadores que no comparten pantalla.

### 3. Estado de Cursores en Pinia
En `multiplayerStore.js`, se añadirá un objeto `remoteCursors` que almacenará las coordenadas `{x, y}` indexadas por el nombre de usuario de los compañeros.
- **Rationale**: Proporciona una fuente de verdad reactiva para que el componente Vue renderice las linternas adicionales.

### 4. Renderizado de Múltiples Linternas (RadarScan.vue)
Se cambiará el sistema de overlay de una única variable CSS a una máscara dinámica.
- **Solución Técnica**: Utilizar `mask-image` o un canvas dedicado que dibuje múltiples gradientes radiales. La opción de `mask-image` con múltiples `radial-gradient` concatenados es la más eficiente para CSS puro.

### 5. Lógica de Objetivos Dinámicos
El servidor generará un array de objetivos `targets` igual al tamaño del equipo. Cada `target` tendrá un `assignedTo` (username).
- **Rationale**: Asegura que la "cooperación forzada" se cumpla, ya que ningún jugador puede ganar la ronda por sí solo.

## Risks / Trade-offs

- **[Riesgo] Saturación del Servidor por MOUSE_MOVE** → **Mitigación**: Implementar un *throttle* (ej. cada 50ms) en el envío de coordenadas desde el frontend.
- **[Riesgo] Visión excesiva en equipos grandes** → **Mitigación**: Ajustar el tamaño del radio de la linterna (`tunnelSize`) inversamente proporcional al número de jugadores en el equipo.
