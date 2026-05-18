## ADDED Requirements

### Requirement: Restauración del diseño estético vintage original
El minijuego RadioSignal DEBERÁ usar el diseño y el comportamiento visual definido en el commit `"modificacions visuals i utilitats per millora"`, incluyendo los potenciómetros y controles clásicos sin alteraciones.

#### Scenario: Visualización del panel de mandos retro
- **WHEN** se carga el minijuego RadioSignal en multijugador
- **THEN** el tablero muestra los diales de volumen y filtros con la estética vintage original y los potenciómetros giratorios.

### Requirement: Caja de texto de transmisión rápida para el Oyente
El jugador Oyente (`listener`), que es el único que escucha las frases habladas, DEBERÁ disponer de un cuadro de texto para transcribir y enviar la frase transmitida directamente a la pantalla del Escritor (`writer`).

#### Scenario: Envío de transcripción al Escritor
- **WHEN** el Oyente escucha la frase, la escribe en la caja de transmisión rápida y pulsa enviar
- **THEN** el Escritor ve aparecer la frase transcrita en su pantalla para poder escribirla en la caja de respuesta final.
