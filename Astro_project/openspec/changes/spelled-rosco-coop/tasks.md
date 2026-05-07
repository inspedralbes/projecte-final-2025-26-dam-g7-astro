## 1. Preparación de Datos (Diccionario Visual)

- [x] 1.1 Extender el esquema de palabras en el backend para incluir el campo `hieroglyphs` (array de 3 emojis).
- [x] 1.2 Actualizar el archivo de constantes o la base de datos de SpelledRosco con los nuevos jeroglíficos para cada palabra.
- [x] 1.3 Crear un endpoint o servicio de utilidad para validar que todas las palabras del rosco tengan sus 3 emojis asignados.

## 2. Lógica del Backend (Multiplayer & Roles)

- [x] 2.1 Definir los sub-roles `TRANSLATOR` y `GUESSER` en las constantes del juego.
- [x] 2.2 Implementar la asignación inicial de roles por pareja al inicio de la partida.
- [x] 2.3 Desarrollar el `RoleManager` para gestionar el intercambio de roles (trigger en letra M/N o X fallos).
- [x] 2.4 Actualizar el estado de la partida para trackear el progreso cooperativo (letras acertadas por pareja).

## 3. Comunicación en Tiempo Real (WebSockets)

- [x] 3.1 Registrar el manejador de eventos para `PARTNER_TYPING` (typing_sync) en el servidor.
- [x] 3.2 Implementar la retransmisión del evento de tecleo únicamente al compañero de equipo.
- [x] 3.3 Añadir validación en el servidor para asegurar que solo el `GUESSER` puede enviar respuestas finales.

## 4. Frontend - Store e Integración

- [x] 4.1 Adaptar `astroStore` o crear uno específico para gestionar el estado del Rosco Coop (jeroglíficos, sub-rol, ghost text).
- [x] 4.2 Implementar acciones para manejar el evento `GAME_ROLES_SWAPPED` y actualizar la UI localmente.
- [x] 4.3 Integrar el evento `typing_sync` con un throttle de 150ms.

## 5. Frontend - Componentes y UI

- [x] 5.1 Modificar el componente `SpelledRosco.vue` para soportar renderizado condicional según el sub-rol.
- [x] 5.2 Crear el sub-componente `HieroglyphDisplay.vue` para mostrar los 3 emojis al Traductor.
- [x] 5.3 Implementar el "Ghost Text" o previsualización en la vista del Traductor para ver qué escribe su compañero.
- [x] 5.4 Asegurar el uso de la fuente `OpenDyslexic` en todos los inputs y etiquetas de texto del juego.

## 6. Validación y Pruebas

- [x] 6.1 Realizar pruebas de integración para el flujo de intercambio de roles.
- [x] 6.2 Verificar la latencia del `typing_sync` en un entorno con múltiples parejas.
- [x] 6.3 Validar la accesibilidad visual de los jeroglíficos elegidos.
