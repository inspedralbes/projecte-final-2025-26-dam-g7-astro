## ADDED Requirements

### Requirement: Cross-transmission in Radio Signal
En el modo cooperativo, los jugadores DEBEN ver la información objetivo del otro jugador para fomentar la coordinación.

#### Scenario: Interchanging target data
- **WHEN** el Jugador A y el Jugador B están en una partida de Radio Signal
- **THEN** el Jugador A ve la frase que el Jugador B debe escribir y viceversa

### Requirement: No cooldown for audio signal
El botón de transmisión de señal de audio DEBE permitir un uso continuo sin tiempo de espera.

#### Scenario: Immediate signal retransmission
- **WHEN** el usuario pulsa el botón de señal de audio repetidamente
- **THEN** la señal se emite en cada pulsación sin bloqueos por cooldown
