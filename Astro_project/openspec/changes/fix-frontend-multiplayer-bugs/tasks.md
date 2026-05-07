## 1. SpelledRosco: Corrección de Visibilidad

- [x] 1.1 Añadir `watch` sobre `multiplayerStore.room` para reinicializar `roscoLetters` cuando los datos de la sala se actualicen.
- [x] 1.2 Asegurar que la lógica de `onMounted` maneje correctamente el estado inicial vacío de la sala.

## 2. RadioSignal: Optimización de Audio

- [x] 2.1 Verificar y eliminar cualquier `throttle` o `debounce` en la función `speakPhrase`.
- [x] 2.2 Asegurar que `window.speechSynthesis.cancel()` se ejecute de forma efectiva antes de cada nueva alocución.

## 3. RadarScan: Iluminación y Mecánicas

- [x] 3.1 Refactorizar `flashlightStyle` para usar `mask-image` con múltiples gradientes radiales concatenados, permitiendo ver a través de las linternas de todos los jugadores.
- [x] 3.2 Eliminar el renderizado de múltiples divs `flashlight-overlay` en el template, centralizando todo en un único overlay.
- [x] 3.3 Implementar el envío y recepción del evento `RADAR_CLICK` para sincronizar el feedback visual de aciertos/fallos entre jugadores.
- [x] 3.4 Modificar `generateBoard` para incluir al menos 2 letras señuelo aleatorias en modo multijugador.

## 4. Validación

- [x] 4.1 Probar SpelledRosco en modo multijugador y verificar que el 'sender' vea la palabra.
- [x] 4.2 Probar RadioSignal y verificar que el botón de audio responda instantáneamente a clics repetidos.
- [x] 4.3 Probar RadarScan en modo multijugador y verificar que las linternas de ambos jugadores iluminen el tablero correctamente sin oscurecerse entre sí.
- [x] 4.4 Verificar la presencia de letras señuelo en RadarScan.
