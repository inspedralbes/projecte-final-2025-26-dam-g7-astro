## 1. Utilidades y Constantes

- [x] 1.1 Ampliar `EMOJI_LIBRARY` en `emojis.js` con nuevas categorías y más emojis.
- [x] 1.2 Crear `roscoHints.js` en `utils/` para clasificar palabras por categoría y tipo.

## 2. SpelledRosco: Pistas e Inteligencia

- [x] 2.1 Integrar `roscoHints.js` en el componente `SpelledRosco.vue` para generar pistas en tiempo real.
- [x] 2.2 Implementar visualización de chips de pistas para el rol 'guesser'.
- [x] 2.3 Rediseñar el componente del selector de emojis con navegación por pestañas de categorías.

## 3. Radio Signal: Transmisión Cruzada e Interactividad

- [x] 3.1 Eliminar el cooldown del botón de envío de señal de audio.
- [x] 3.2 Modificar la lógica para que el Jugador A vea los objetivos del Jugador B y viceversa.
- [x] 3.3 Implementar el mini-chat de texto integrado usando eventos de `multiplayerStore`.
- [x] 3.4 Estilizar el mini-chat para que encaje con la estética de la radio.

## 4. RhymeSquad: Sincronización de Roles y Dificultad

- [ ] 4.1 Definir y aplicar restricciones de control basadas en el rol (Catcher vs Sniper).
- [ ] 4.2 Implementar la visualización del cursor remoto del Sniper para el Catcher.
- [ ] 4.3 Sincronizar la destrucción instantánea de meteoritos basura mediante eventos de red.
- [ ] 4.4 Ajustar dinámicamente la velocidad y densidad de caída en el modo cooperativo 2vs2.

## 5. Validación y Pruebas

- [ ] 5.1 Verificar el flujo completo de SpelledRosco con pistas y nuevo selector.
- [ ] 5.2 Comprobar la sincronización y comunicación en Radio Signal.
- [ ] 5.3 Validar la separación de roles y sincronización de objetos en RhymeSquad.
