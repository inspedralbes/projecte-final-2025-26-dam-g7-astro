## 1. Radar Scan (Double Linterna)

- [x] 1.1 Implementar transmisión sincronizada de la linterna del compañero mediante `RADAR_LIGHT_MOVE` con throttle en `RadarScan.vue`.
- [x] 1.2 Habilitar revelación coordinada del tablero cuando cualquiera de los dos haga clic en una celda (`RADAR_CELL_REVEAL`).

## 2. Rhyme Squad (Palabras Caídas)

- [x] 2.1 Sincronizar la generación e índices de burbujas de palabras en cooperativo 2vs2 (`RHYME_SPAWN_TRIGGER`) para que caigan de forma idéntica en ambos clientes.

## 3. Word Construction (Arrastre Libre y Cursores)

- [ ] 3.1 Revertir el diseño visual de `WordConstruction.vue` para que sea idéntico al modo Singleplayer.
- [ ] 3.2 Habilitar arrastre bidireccional libre de letras sincronizado en tiempo real (`WORD_LETTER_MOVE`).
- [ ] 3.3 Mostrar el cursor de ratón del compañero de equipo en tiempo real (`WORD_CURSOR_MOVE`).
- [ ] 3.4 Eliminar el banner superior que advierte sobre cooperar en `WordConstruction.vue`.

## 4. Symmetry Breaker (Cursor Doble y Coincidencia)

- [ ] 4.1 Sincronizar y renderizar el cursor de ratón del compañero sobre la cuadrícula (`SYMMETRY_CURSOR_MOVE`).
- [ ] 4.2 Programar la detección de coincidencia simultánea sobre el bloque correcto para otorgar puntos al equipo (`SYMMETRY_TILE_HOVER`).

## 5. Radio Signal (Diseño Vintage e Input de Transmisión)

- [ ] 5.1 Revertir la estética de `RadioSignal.vue` al diseño clásico vintage del commit `"modificacions visuals i utilitats per millora"`.
- [ ] 5.2 Añadir caja de input de transmisión rápida en el panel del Oyente.
- [ ] 5.3 Implementar receptor en la interfaz del Escritor para mostrar la frase transmitida por el Oyente (`RADIO_TRANSMIT_PHRASE`).

## 6. Spelled Rosco (Recepción de Pistas en Cooperativo)

- [ ] 6.1 Asegurar que el Emisor envíe y el Adivinador reciba la definición/pista de la letra activa en tiempo real (`ROSCO_CLUE_SUBMIT`).
