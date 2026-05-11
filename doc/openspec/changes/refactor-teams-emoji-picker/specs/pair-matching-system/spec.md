## ADDED Requirements

### Requirement: Pair Grouping Logic
El sistema SHALL agrupar a los jugadores en equipos de exactamente 2 personas para los minijuegos cooperativos identificados ('SpelledRosco', 'RadioSignal', 'RhymeSquad', 'RadarScan').

#### Scenario: Agrupación en sala con 4 jugadores
- **WHEN** comienza una partida cooperativa con 4 jugadores
- **THEN** el sistema crea dos equipos (`team-1`, `team-2`) con 2 jugadores cada uno

### Requirement: Cooperative Role Assignment
El sistema SHALL asignar roles específicos y complementarios a cada miembro de la pareja. Para 'SpelledRosco', uno será 'sender' y el otro 'guesser'.

#### Scenario: Asignación balanceada de roles
- **WHEN** se crean los equipos de 2 personas
- **THEN** cada equipo tiene exactamente un 'sender' y un 'guesser'
