## ADDED Requirements

### Requirement: Única Letra Intrusa Generada por Host
En el modo multijugador coordinado de RADARSCAN, el sistema SHALL generar una única letra intrusa (target) para todo el equipo. El Host es el responsable de generar esta posición y sincronizarla con el resto de jugadores.

#### Scenario: Generación Sincronizada de Intrusa
- **WHEN** comienza una nueva ronda en RADARSCAN multijugador
- **THEN** el Host genera una posición de intruso y envía la acción `BOARD_SYNC` con un único índice de objetivo compartido.

### Requirement: Doble Confirmación de Intruso
Para avanzar de ronda en RADARSCAN multijugador, todos los miembros del equipo DEBEN clicar la misma letra intrusa. El sistema SHALL marcar visualmente la letra cuando un jugador la clica (ej. cambio de color) y esperar a que el compañero también la clique antes de disparar la transición de nivel.

#### Scenario: Cooperación Exitosa
- **WHEN** el Jugador A clica la letra intrusa correcta
- **THEN** la letra se ilumina para AMBOS jugadores y el sistema espera el clic del Jugador B para finalizar la ronda.

### Requirement: Efecto de Niebla Cooperativo
El sistema SHALL restaurar el efecto visual de "niebla" o linterna oscura, donde cada jugador tiene su propio foco de luz visible para sí mismo y para su compañero, permitiendo la exploración conjunta del tablero.

#### Scenario: Visibilidad Compartida
- **WHEN** dos jugadores mueven sus ratones sobre el tablero
- **THEN** se visualizan dos focos de luz que revelan las letras subyacentes, permitiendo que ambos vean áreas distintas simultáneamente.
