## Why

Añadir profundidad competitiva y pulido técnico al juego multijugador mediante un sistema de torneos con coste de entrada, una gestión de estado robusta para evitar errores visuales entre partidas, y un modo de juego asimétrico "Modo Jefe" que fomente la interacción dinámica entre jugadores.

## What Changes

- **Inscripción a Torneos**: Implementación de lógica en el backend para validar el saldo del usuario en la base de datos SQL y descontar el coste de inscripción antes de permitir el acceso.
- **Gestión de Interfaz (UI Reset)**: Adopción de un patrón en Vue.js para limpiar y reiniciar completamente el estado de los minigames (puntos, cronómetros, variables locales) al finalizar o iniciar sesiones.
- **Modo Jefe (1 vs Todos)**: Creación de un sistema de combate asimétrico mediante WebSockets donde un "Jefe" tiene vida compartida y los "Héroes" le atacan, con eventos de interferencia y un feed de acciones en tiempo real.

## Capabilities

### New Capabilities
- `tournament-enrollment`: Sistema de validación y cobro de inscripciones basado en el saldo del usuario (SQL).
- `ui-state-reset`: Protocolo de reinicio de estado para componentes Vue para asegurar una pantalla limpia entre partidas.
- `boss-mode-ws`: Motor de juego asimétrico sobre WebSockets que gestiona HP del jefe, ataques de héroes e interferencias del jefe.

### Modified Capabilities
- Ninguna.

## Impact

- **Backend**: Nuevas rutas en `backend/src/routes`, lógica de negocio en `backend/src/services` y gestión de salas en `backend/src/ws`.
- **Frontend**: Componentes de Vue.js en `frontend/web/src/components` y posiblemente stores en Pinia/Vuex para el estado del juego.
- **Base de Datos**: Consultas SQL para actualizar el saldo del usuario.
