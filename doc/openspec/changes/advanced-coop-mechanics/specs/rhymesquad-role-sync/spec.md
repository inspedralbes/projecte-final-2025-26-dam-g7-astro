## ADDED Requirements

### Requirement: RhymeSquad Role Separation
Los jugadores DEBEN tener roles diferenciados (Catcher y Sniper) con capacidades únicas.

#### Scenario: Catcher capabilities
- **WHEN** el usuario tiene el rol de 'Catcher'
- **THEN** puede mover la nave y colisionar con rimas, pero no puede destruir meteoritos haciendo clic

#### Scenario: Sniper capabilities
- **WHEN** el usuario tiene el rol de 'Sniper'
- **THEN** puede destruir meteoritos haciendo clic y su cursor es visible para el Catcher

### Requirement: Real-time Object Destruction
La destrucción de objetos DEBE ser instantánea y estar sincronizada entre todos los jugadores.

#### Scenario: Instant meteor disappearance
- **WHEN** el Sniper destruye un meteorito
- **THEN** el meteorito desaparece simultáneamente en la pantalla del Catcher

### Requirement: Dynamic Difficulty Scaling
El sistema DEBE aumentar la dificultad en el modo cooperativo 2vs2.

#### Scenario: Increased speed and density
- **WHEN** la partida se inicia en modo 2vs2
- **THEN** la velocidad de caída y el número de palabras basura son mayores que en modo solitario
