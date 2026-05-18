## ADDED Requirements

### Requirement: Restauración del diseño estético del modo Singleplayer
El diseño visual, la paleta de colores y la disposición espacial de WordConstruction en modo multijugador cooperativo DEBERÁN ser exactamente idénticos a los del modo Singleplayer.

#### Scenario: Visualización del diseño original sin banner cooperativo
- **WHEN** se inicia el minijuego WordConstruction en cooperativo
- **THEN** el tablero tiene el mismo estilo y colores que en el modo individual y el banner superior que avisa de cooperar no se muestra en la interfaz.

### Requirement: Arrastre libre bidireccional y cursores compartidos
Ambos jugadores DEBERÁN poder interactuar de forma simultánea arrastrando libremente las letras a cualquier posición del tablero, viendo las posiciones del cursor de su compañero.

#### Scenario: Arrastre sincronizado de letras y visualización de cursores
- **WHEN** un jugador arrastra una letra o mueve el ratón en su tablero
- **THEN** el otro jugador ve desplazarse la letra al nuevo índice de manera fluida y observa el cursor remoto de su compañero en tiempo real.
