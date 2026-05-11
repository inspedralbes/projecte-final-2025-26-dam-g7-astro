## Why

Implementar un modo cooperativo 2vs2 en "SpelledRosco" que fomente la colaboración asimétrica extrema. Al limitar la comunicación a emojis, se crea un reto de coordinación divertido y accesible que diferencia la experiencia multijugador de la individual, potenciando el aspecto social y estratégico del juego en equipo.

## What Changes

- **Roles Asimétricos**: División de tareas entre 'Emisor' (que posee la información pero no puede actuar sobre el rosco) y 'Adivinador' (que actúa pero no tiene la definición).
- **Panel de Emojis**: Nueva interfaz para el Emisor con un selector de pictogramas categorizados para dar pistas.
- **Historial de Chat de Pareja**: Visualización en tiempo real de los emojis enviados en una burbuja de chat persistente durante la letra actual.
- **Intercambio Dinámico**: Rotación automática de roles entre los miembros de la pareja después de que el Adivinador acierte la palabra.
- **Restricciones de Input**: Bloqueo del teclado para el Emisor y ocultación de la definición real para el Adivinador.

## Capabilities

### New Capabilities
- `rosco-emoji-chat-sync`: Protocolo WebSocket para el envío y recepción de emojis restringido al compañero de equipo (`teamId`).
- `rosco-asymmetric-roles`: Definición y control de los sub-roles `sender` y `guesser` dentro de la sesión de juego.
- `rosco-role-swap-logic`: Lógica de transición de estado que invierte los roles tras un evento de acierto (`correct_answer`).

### Modified Capabilities
- (None)

## Impact

- **Backend**:
    - `RoomManager.js`: Nuevo manejador para el evento `EMOJI_CHAT`.
    - Lógica de asignación de roles inicial y rotación tras acierto.
- **Frontend**:
    - `SpelledRosco.vue`: Refactorización para renderizado condicional según sub-rol.
    - `multiplayerStore.js`: Gestión de los mensajes de emoji entrantes para el chat local.
- **Accesibilidad**:
    - Uso de la fuente `OpenDyslexic` en los elementos de texto clave.
    - Etiquetas descriptivas para los botones de emoji (herramientas de lectura de pantalla).
