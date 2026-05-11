## ADDED Requirements

### Requirement: Paridad Visual con Modo Individual
El componente `WordConstruction` multijugador SHALL utilizar exactamente el mismo conjunto de estilos CSS y disposición de elementos que la versión individual, asegurando una experiencia de usuario consistente.

#### Scenario: Coherencia de Interfaz
- **WHEN** un jugador accede al modo multijugador de Word Construction
- **THEN** los colores de las fichas, sombras, y tipografías deben ser idénticos a los del modo entrenamiento.

### Requirement: Comportamiento de Snap-back
El sistema SHALL devolver automáticamente cualquier letra a su posición original de inicio de ronda si el jugador la suelta fuera de un slot de destino válido o lejos de una zona de encaje.

#### Scenario: Error al Soltar Ficha
- **WHEN** un jugador arrastra una letra y la suelta en medio del tablero (lejos de los slots)
- **THEN** la letra realiza una transición suave de vuelta a su posición de origen en el pool de letras.
