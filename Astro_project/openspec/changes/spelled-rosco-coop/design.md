## Context

Actualmente, el minijuego "SpelledRosco" es una experiencia individual de deletreo basada en definiciones de texto. Para potenciar el modo multijugador cooperativo, se propone la mecánica "Jeroglíficos Alienígenas" en formato 2vs2. Esta mecánica introduce asimetría de información y colaboración en tiempo real, inspirada en patrones de diseño de juegos cooperativos modernos.

## Goals / Non-Goals

**Goals:**
- Implementar la mecánica de "Jeroglíficos Alienígenas": definiciones visuales mediante tríos de emojis.
- Definir y gestionar roles asimétricos: `Translator` (ve pistas) y `Guesser` (escribe respuesta).
- Habilitar la sincronización de escritura en tiempo real (`typing_sync`) para feedback visual inmediato entre compañeros.
- Automatizar el intercambio de roles a mitad del juego (letra M/N) o por umbral de fallos.
- Garantizar la accesibilidad mediante el uso de la fuente OpenDyslexic.

**Non-Goals:**
- Alterar el funcionamiento del modo solitario de SpelledRosco.
- Implementar sistemas de comunicación externa (chat de voz/texto) dentro del minijuego.
- Modificar el sistema de puntuación global, más allá de adaptarlo al formato de parejas.

## Decisions

- **Esquema de Datos (MongoDB/JS)**: Se extenderá el objeto de palabra con un campo `hieroglyphs` (array de 3 strings con códigos de emoji). Esto permite que el backend envíe solo los emojis al Traductor y la letra al Adivinador.
- **Gestión de Estados (WebSocket)**: El servidor mantendrá el estado del rosco por pareja (`currentPairLetter`, `pairScore`, `errors`). El evento `typing_sync` se retransmitirá al compañero de equipo para mostrar un "ghost text" o previsualización de lo que el otro está escribiendo.
- **Renderizado Condicional (Vue 3)**: El componente principal de SpelledRosco detectará el sub-rol del jugador desde el `astroStore` o `multiplayerService` y ocultará/mostrará el input de texto o los jeroglíficos según corresponda.
- **Trigger de Cambio de Rol**: Se implementará un `RoleManager` en el backend que dispare un evento `GAME_ROLES_SWAPPED` al alcanzar la mitad del alfabeto o al superar un número configurado de fallos.
- **Estilos y Accesibilidad**: Se aplicará una clase global o un mixin de CSS para asegurar que todos los elementos de texto e input utilicen `OpenDyslexic` por defecto.

## Risks / Trade-offs

- **[Riesgo] Ambigüedad en los Jeroglíficos**: Los emojis pueden ser subjetivos. → **Mitigación**: Proporcionar un conjunto curado de tríos de emojis que tengan una relación lógica directa (ej: 🍎 + 🥧 = Tarta).
- **[Riesgo] Saturación de WebSockets**: El envío de cada pulsación de tecla puede generar mucho tráfico. → **Mitigación**: Implementar un throttle de 150ms en la emisión de `typing_sync`.
- **[Riesgo] Desincronización en el Cambio de Rol**: Un jugador podría cambiar de rol antes que el otro visualmente. → **Mitigación**: El cambio de rol debe ser bloqueante; el juego se pausa brevemente con una animación de "Intercambio" hasta que ambos clientes confirmen la recepción del evento.
