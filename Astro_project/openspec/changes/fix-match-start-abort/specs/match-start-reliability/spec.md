## ADDED Requirements

### Requirement: Robutez en la transición a PLAYING
El sistema SHALL garantizar que al cambiar el estado de la sala a 'PLAYING', se inicialicen todos los datos necesarios y se activen los mecanismos de control de la ronda (temporizadores).

#### Scenario: Inicio exitoso de ronda
- **WHEN** el host envía el comando para iniciar el juego tras la ruleta
- **THEN** el estado de la sala cambia a 'PLAYING', se inicializan los datos del juego y se inicia un temporizador de seguridad en el servidor.

### Requirement: Gestión de finalización de ronda
El sistema SHALL permitir que los jugadores notifiquen la finalización de su participación en el minijuego y actuar en consecuencia para terminar la ronda global.

#### Scenario: Todos los jugadores terminan a tiempo
- **WHEN** todos los jugadores envían la señal de finalización antes de que expire el tiempo
- **THEN** el servidor detiene el temporizador y transiciona la sala al estado 'ROUND_RESULTS'.

#### Scenario: El tiempo expira antes de que todos terminen
- **WHEN** el temporizador de seguridad expira
- **THEN** el servidor fuerza el fin de la ronda, calcula resultados con los datos disponibles y transiciona la sala a 'ROUND_RESULTS'.
