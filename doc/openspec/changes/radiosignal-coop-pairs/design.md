## Context

El sistema multijugador actual permite la creación de salas, pero la lógica de equipos es rudimentaria (rojo vs azul). RadioSignal es un juego de audio individual que se quiere transformar en una experiencia cooperativa por parejas con roles asimétricos (Oyente/Escritor).

## Goals / Non-Goals

**Goals:**
- Implementar un sistema de emparejamiento dinámico en el backend.
- Sincronizar sub-roles y eventos de escritura en tiempo real entre miembros de la pareja.
- Adaptar RadioSignal para renderizar interfaces condicionales.
- Garantizar la accesibilidad visual mediante OpenDyslexic.

**Non-Goals:**
- No se modificará la lógica de otros minijuegos fuera de RadioSignal en este cambio.
- No se implementará un sistema de chat de voz integrado (se asume comunicación externa o mediante la guía visual).

## Decisions

### 1. Estructura de Datos de Equipos (Backend)
Se utilizará un nuevo campo `pairs` en el objeto de la sala en `RoomManager.js`. Cada par será un objeto `{ teamId, players: [u1, u2], roles: { u1: 'listener', u2: 'writer' } }`.
- **Rationale**: Esta estructura permite una búsqueda rápida del compañero y su rol asociado sin sobrecargar el objeto `gameConfig`.

### 2. Protocolo de Sincronización de Escritura
Se enviará un evento `TYPING_SYNC` a través de WebSockets cada vez que el 'Escritor' modifique su input. 
- **Alternativa**: Enviar el texto completo cada X milisegundos (polling).
- **Decisión**: Eventos basados en cambios (push) para minimizar latencia y asegurar que el 'Oyente' vea la progresión letra a letra.

### 3. Renderizado Condicional (Frontend)
El componente `RadioSignal.vue` utilizará `v-if` basados en un nuevo estado `subRole` de la `multiplayerStore`.
- **Rationale**: Mantener un único componente facilita el mantenimiento de la lógica común (temporizadores, puntuación) mientras se segrega la UI de juego.

### 4. Alternancia de Roles
El backend gestionará el cambio de roles al finalizar satisfactoriamente un nivel, enviando un `ROOM_UPDATE` o un evento específico de inicio de nivel con la nueva configuración.
- **Rationale**: Centralizar la lógica de roles en el servidor evita desincronizaciones entre clientes.

## Risks / Trade-offs

- **[Riesgo] Latencia en la escritura remota** → **Mitigación**: Implementar un pequeño debounce en el emisor o confiar en la velocidad de los WebSockets para una sensación "en vivo".
- **[Riesgo] Parejas impares** → **Mitigación**: El backend no permitirá el inicio del modo RadioSignal cooperativo si el número de jugadores no es par (o asignará un rol "observador" si se desea escalar en el futuro).
- **[Trade-off] Dependencia total del compañero** → Si un jugador se desconecta, la pareja queda inactiva. Mitigación: Detección de desconexión y fin de ronda automático para esa pareja.
