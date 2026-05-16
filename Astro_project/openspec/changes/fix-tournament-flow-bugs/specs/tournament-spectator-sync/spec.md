## ADDED Requirements

### Requirement: Sincronización de Componente por Servidor
El servidor DEBE enviar el nombre del minijuego activo a todos los miembros de la sala al iniciar un combate.

#### Scenario: Espectador carga el juego correcto
- **WHEN** el servidor emite el evento `MATCH_STARTING` con `currentGame: 'WordConstruction'`.
- **THEN** todos los espectadores montan dinámicamente el componente `WordConstruction` en modo lectura.

### Requirement: Visualización en Tiempo Real para Espectadores
Los espectadores DEBEN ver la progresión (puntos, letras, tiempo) del jugador que están observando sin poder interactuar.

#### Scenario: Actualización de estado observador
- **WHEN** el servidor retransmite un acierto del jugador observado.
- **THEN** la UI del espectador actualiza la barra de progreso y puntuación instantáneamente.
