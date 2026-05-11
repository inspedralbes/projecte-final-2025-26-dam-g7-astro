## Why

Actualmente, el modo multijugador utiliza equipos grandes (red vs blue) sin una interdependencia fuerte entre los miembros. La implementación de una lógica de equipos por parejas y roles asimétricos en RadioSignal permitirá una colaboración mucho más estrecha y necesaria, mejorando la profundidad mecánica y la comunicación entre los jugadores.

## What Changes

- **Lógica Global de Parejas**: Modificación de la asignación de equipos en `RoomManager.js` para crear grupos estrictos de 2 jugadores.
- **Roles Asimétricos en RadioSignal**: Introducción de los roles 'Oyente' (solo audio) y 'Escritor' (solo input) en el minijuego RadioSignal.
- **Sincronización de Typing**: Retransmisión en tiempo real de lo que escribe el 'Escritor' a su compañero 'Oyente'.
- **Intercambio Dinámico**: Inversión automática de roles al superar cada nivel dentro de la misma ronda.
- **Accesibilidad Visual**: Inclusión de indicadores claros de rol y soporte para la fuente OpenDyslexic.

## Capabilities

### New Capabilities
- `multiplayer-pair-management`: Gestión de la agrupación de jugadores en parejas dentro de una sala.
- `asymmetric-role-sync`: Sincronización de sub-roles (Oyente/Escritor) y sus permisos asociados.
- `typing-relay-service`: Servicio para retransmitir eventos de escritura en tiempo real entre compañeros de pareja.

### Modified Capabilities
- `radiosignal-core`: Adaptación de la lógica del minijuego para soportar el flujo cooperativo y la validación por pareja.

## Impact

- **Backend**:
    - `src/ws/RoomManager.js`: Lógica de emparejamiento y gestión de sub-roles.
    - Manejo de nuevos tipos de mensajes WebSocket (`TYPING_SYNC`).
- **Frontend**:
    - `src/stores/multiplayerStore.js`: Estado para el sub-rol actual y el texto sincronizado.
    - `src/components/games/RadioSignal.vue`: Refactorización de la UI para renderizado condicional según rol.
    - Estilos globales para la fuente OpenDyslexic.
