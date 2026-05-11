## Why

Implementar un modo cooperativo 2vs2 en el minijuego "SpelledRosco" para fomentar la colaboración entre jugadores y ofrecer una experiencia de juego asimétrica única. Este cambio introduce la mecánica de "Jeroglíficos Alienígenas", reemplazando las definiciones de texto tradicionales por pistas visuales (emojis), lo que mejora la accesibilidad y el dinamismo social del juego.

## What Changes

- **Jeroglíficos Alienígenas**: Sustitución de las definiciones de texto del rosco por secuencias de 3 emojis/pictogramas por palabra.
- **Roles Asimétricos**: 
    - **Traductor**: Ve los emojis y la letra actual, pero no puede escribir.
    - **Adivinador**: Solo ve la letra actual y un campo de texto vacío para adivinar.
- **Sincronización en Vivo**: El Adivinador emite eventos de teclado (`typing_sync`) para que el Traductor vea en tiempo real lo que está escribiendo y pueda guiarle ortográficamente.
- **Cambio de Rol**: Intercambio automático de roles entre los miembros de la pareja al llegar a la mitad del rosco (letra M/N) o tras un número determinado de fallos.
- **Interfaz Adaptativa**: Renderizado condicional del componente Rosco basado en el sub-rol asignado.

## Capabilities

### New Capabilities
- `spelled-rosco-coop-mode`: Gestión general del modo cooperativo 2vs2 para el Rosco.
- `emoji-visual-dictionary`: Sistema de definiciones basadas en emojis en lugar de texto.
- `asymmetric-role-sync`: Mecánica de roles diferenciados y sincronización de escritura en tiempo real.

### Modified Capabilities
- (None)

## Impact

- **Backend**: 
    - Ampliación del esquema del diccionario de palabras para incluir el array de emojis.
    - Lógica de progresión por pareja y gestión del estado de los roles.
    - Emisión y retransmisión de eventos `typing_sync` vía WebSockets.
- **Frontend**: 
    - Nuevos sub-componentes para los roles de Traductor y Adivinador.
    - Integración de la fuente OpenDyslexic en los inputs de juego.
    - Indicadores visuales claros para el estado de los roles.
