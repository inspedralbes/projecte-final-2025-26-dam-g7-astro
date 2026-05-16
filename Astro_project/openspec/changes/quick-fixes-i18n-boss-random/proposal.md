## Why

Corregir errores técnicos menores y mejorar la equidad en el Modo Jefe:
1. El archivo de traducciones al inglés (`en.json`) contiene una clave duplicada `"shop"`, lo que invalida el JSON y puede causar fallos en la carga del frontend.
2. La lógica actual del Modo Jefe asigna siempre al Host como Jefe, lo que es predecible y poco equitativo. Se requiere una selección aleatoria entre todos los participantes.

## What Changes

- **i18n**: Eliminación de la clave duplicada `"shop"` en `frontend/web/src/i18n/locales/en.json` (preferiblemente manteniendo la estructura más completa o corrigiendo la duplicación).
- **Multiplayer Logic**: Refactorización de la asignación del `boss` en `backend/src/ws/RoomManager.js` para usar `Math.random()` sobre la lista de jugadores.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `boss-mode-ws`: Mejora en la inicialización para permitir la selección aleatoria del jefe.
- `i18n-validity`: Corrección de sintaxis en los archivos de localización.

## Impact

- **Frontend**: Mejora la estabilidad al cargar las traducciones.
- **Backend**: Cambia ligeramente el comportamiento de inicio de partida en el modo jefe.
