## Context

El minijuego RadarScan actualmente funciona de forma individual en el modo multijugador, donde cada jugador compite por ser el más rápido. El objetivo es extender esto a un modo cooperativo 2vs2 donde los miembros de un equipo comparten visibilidad (linternas) pero tienen objetivos distintos que deben recolectar individualmente para avanzar la ronda.

## Goals / Non-Goals

**Goals:**
- Sincronizar el cursor del ratón entre compañeros de equipo en tiempo real (<50ms latencia).
- Visualizar dos linternas en la pantalla del jugador (la propia y la del compañero).
- Implementar lógica de objetivos divididos (Objetivo A para Jugador 1, Objetivo B para Jugador 2).
- Bloquear la interacción con el objetivo del compañero.

**Non-Goals:**
- Sincronizar linternas con los oponentes del otro equipo.
- Cambiar las mecánicas base de otros minijuegos (solo RadarScan).
- Chat de voz integrado.

## Decisions

### 1. Modelo de Equipos en RoomManager
**Decisión**: Utilizar una propiedad `teamId` (1 o 2) en el objeto de estado de la sala para cada jugador.
**Racional**: Permite filtrar fácilmente los destinatarios de los mensajes de sincronización de ratón.
**Alternativa**: Usar arrays separados para cada equipo, pero complica la lógica de iteración actual de `room.players`.

### 2. Protocolo de Sincronización de Ratón
**Decisión**: Enviar mensajes de tipo `GAME_ACTION` con subtipo `MOUSE_MOVE` con una frecuencia de 30-60 fps (mediante `requestAnimationFrame` o `throttle`).
**Racional**: Minimiza la carga del servidor WebSockets mientras mantiene la fluidez visual.
**Detalle**: El backend retransmitirá estos mensajes *solo* a los jugadores con el mismo `teamId`.

### 3. Renderizado de Doble Linterna en Frontend
**Decisión**: Usar la propiedad CSS `mask-image` con múltiples `radial-gradient` o, en su defecto, un `background` compuesto de gradientes radiales.
**Racional**: Es la forma más eficiente de combinar áreas de visibilidad sin recurrir a Canvas, manteniendo el estilo actual del juego.
**Implementación**:
```css
.flashlight-overlay {
  background: black;
  mask-image: 
    radial-gradient(circle var(--tunnelSize) at var(--mouseX) var(--mouseY), transparent 100%, black 0%),
    radial-gradient(circle var(--tunnelSize) at var(--remoteX) var(--remoteY), transparent 100%, black 0%);
  mask-composite: intersect;
}
```
*Nota: Se ajustará según compatibilidad de navegadores.*

### 4. Lógica de Objetivos Duales
**Decisión**: El servidor generará un objeto `roundConfig` al inicio de cada ronda con `targetA` y `targetB`.
**Racional**: Garantiza que ambos jugadores vean los mismos objetivos en las mismas posiciones.

## Risks / Trade-offs

- **[Riesgo] Sobrecarga de mensajes WS** → **Mitigación**: Aplicar `throttle` (máximo 30 mensajes/segundo) en el frontend antes de enviar.
- **[Riesgo] Latencia visual** → **Mitigación**: Aplicar una transición suave (`transition: transform 0.1s linear`) en la linterna remota para ocultar el "jitter".
- **[Riesgo] Desincronización de objetivos** → **Mitigación**: El estado de "recolectado" debe ser gestionado por el servidor o validado estrictamente mediante eventos de sincronización.
