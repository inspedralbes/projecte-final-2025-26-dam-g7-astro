## ADDED Requirements

### Requirement: Emparejamiento estricto por parejas
El sistema SHALL agrupar a los jugadores de una sala en parejas de dos al iniciar una partida en modo cooperativo. Si el número de jugadores es impar, el último jugador SHALL quedar en espera o el sistema SHALL impedir el inicio hasta completar la pareja.

#### Scenario: Inicio de partida con 4 jugadores
- **WHEN** el host inicia la partida con 4 jugadores en la sala.
- **THEN** el sistema crea 2 parejas (Equipo A y Equipo B) asignando un `teamId` único a cada par.

### Requirement: Balanceo de equipos
El sistema SHALL intentar balancear las parejas basándose en el orden de entrada a la sala o un algoritmo de nivel si estuviera disponible.

#### Scenario: Asignación por orden de entrada
- **WHEN** los jugadores P1, P2, P3 y P4 están en la sala.
- **THEN** el sistema asigna (P1, P2) al Equipo 1 y (P3, P4) al Equipo 2.
