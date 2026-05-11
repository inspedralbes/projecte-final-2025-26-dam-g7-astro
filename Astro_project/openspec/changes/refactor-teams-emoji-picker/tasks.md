## 1. Backend: Refactorización de Equipos y Roles

- [x] 1.1 Modificar `RoomManager.js` para incluir `RadarScan` en la lista de `isPairGame`.
- [x] 1.2 Actualizar la lógica de asignación de equipos en `RoomManager.js` para usar `team-${pairIndex + 1}` en juegos de pareja.
- [x] 1.3 Asegurar que la asignación de `subRoles` (sender/guesser) sea correcta para cada miembro de la pareja en todos los minijuegos cooperativos.
- [x] 1.4 Revisar y actualizar las funciones que dependen de nombres de equipo específicos (`red`/`blue`) para que sean dinámicas (ej. finalización de ronda, cálculo de puntuaciones).

## 2. Frontend: Constantes y Preparación

- [x] 2.1 Crear un nuevo archivo de constantes `frontend/web/src/constants/emojis.js` con una lista extendida de emojis y sus etiquetas de búsqueda.
- [x] 2.2 Importar la nueva lista de emojis en `SpelledRosco.vue`.

## 3. Frontend: Mejora del Selector de Emojis

- [x] 3.1 Añadir un campo `v-text-field` como buscador en la interfaz del `sender` en `SpelledRosco.vue`.
- [x] 3.2 Implementar una propiedad computada `filteredEmojiList` que filtre los emojis basándose en el input del buscador.
- [x] 3.3 Actualizar el grid de emojis para usar `filteredEmojiList` y mejorar el estilo visual (scrollbar, tamaño de iconos).
- [x] 3.4 Limpiar el buscador después de enviar un emoji o al cambiar de palabra.

## 4. Verificación y Pruebas

- [x] 4.1 Verificar en local (con 2-4 jugadores) que los equipos se crean correctamente como `team-1`, `team-2`.
- [x] 4.2 Probar el buscador de emojis con diferentes términos (ej. "animal", "comida", "corazon").
- [x] 4.3 Confirmar que el `guesser` recibe correctamente los emojis enviados por su pareja correspondiente.
