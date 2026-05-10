## 1. Configuración de Base y Store

- [ ] 1.1 Extender `multiplayerStore.js` con el estado `raceFuel` (0-100), `raceProgress` (índice actual) y `partnerProgress`.
- [ ] 1.2 Añadir el tipo de mensaje `RACE_PROGRESS_UPDATE` en el manejador de mensajes del WebSocket.
- [ ] 1.3 Actualizar el `MultiplayerLobby.vue` para permitir seleccionar el modo "Carrera Espacial" y guardar esta configuración.

## 2. Sistema de Combustible Quàntic

- [ ] 2.1 Implementar un `setInterval` en el store o un composable que disminuya el combustible automáticamente.
- [ ] 2.2 Crear el componente `FuelBar.vue` con una estética premium (gradientes de neón y avisos de "Low Fuel").
- [ ] 2.3 Implementar la lógica de recarga (+20% o similar) al recibir el evento de juego completado con éxito.
- [ ] 2.4 Implementar la lógica de Game Over local cuando el combustible llegue a 0.

## 3. Sincronización de Carrera y Progreso

- [ ] 3.1 Definir una lista de minijuegos para la secuencia de la carrera (ej. WordConstruction -> RadioSignal -> ...).
- [ ] 3.2 Implementar la transición automática al siguiente juego al finalizar el actual.
- [ ] 3.3 Crear el componente `SharedProgressBar.vue` que muestre los avatares de ambos jugadores avanzando por la ruta.
- [ ] 3.4 Asegurar que el cambio de juego envíe el mensaje de progreso al oponente.

## 4. Motor de Anomalías Globales

- [ ] 4.1 Crear el componente `GlobalAnomalyManager.vue` que se superponga a cualquier minijuego.
- [ ] 4.2 Implementar el efecto 'Nebulosa' usando filtros CSS (`backdrop-filter: blur` o capas semi-opacas).
- [ ] 4.3 Implementar 'Pluja de Meteorits': elementos que caen y cuya colisión con el cursor activa un estado `disabledClick` de 2s.
- [ ] 4.4 Implementar 'Raig Alienígena': transformación del cursor mediante CSS `cursor: url()` o un elemento que siga al ratón con escala aumentada.
- [ ] 4.5 Implementar un temporizador aleatorio para disparar estas anomalías periódicamente.

## 5. Integración de HUD y Pantallas de Transición

- [ ] 5.1 Crear la `RaceHUD.vue` que agrupe la barra de progreso, la barra de combustible y el gestor de anomalías.
- [ ] 5.2 Diseñar la pantalla de transición entre planetas/juegos con información de "Siguiente Destino" y estado del rival.
- [ ] 5.3 Implementar la pantalla de resultados finales específica para carrera (Ganador/Perdedor por velocidad o supervivencia).
