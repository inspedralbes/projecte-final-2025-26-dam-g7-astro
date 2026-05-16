## ADDED Requirements

### Requirement: Inicio de Partida Síncrono
El servidor DEBE asegurar que el evento de inicio de partida se envíe a todos los participantes simultáneamente después de que se hayan configurado todos los parámetros del juego.

#### Scenario: Transición a Jugando
- **WHEN** el servidor determina que una ronda de torneo o duelo debe empezar.
- **THEN** actualiza el estado de la sala a `PLAYING` y emite el mensaje `MATCH_STARTING` a toda la sala en una sola operación atómica.

### Requirement: Prevención de Bloqueo de UI
El cliente DEBE forzar la desaparición de cualquier overlay de transición ("Iniciando...") inmediatamente después de recibir el evento `MATCH_STARTING`.

#### Scenario: Desbloqueo de Pantalla
- **WHEN** el cliente recibe el mensaje `MATCH_STARTING`.
- **THEN** cambia su estado local `isTransitioning` a `false` y monta el componente del juego correspondiente.
