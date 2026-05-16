## ADDED Requirements

### Requirement: Retorno Automático al Árbol
Todos los usuarios deben ser redirigidos a la vista del árbol del torneo tras concluir un combate.

#### Scenario: Transición al árbol
- **WHEN** un combate termina y se declara el ganador.
- **THEN** el servidor cambia el estado a `TOURNAMENT_BRACKETS` tras una breve pausa en los resultados.

### Requirement: Secuenciación Automática de Combates
El servidor debe orquestar el inicio del siguiente combate disponible en la llave sin intervención humana.

#### Scenario: Lanzamiento de próximo duelo
- **WHEN** la sala ha estado en `TOURNAMENT_BRACKETS` durante 7 segundos.
- **THEN** el servidor busca el primer combate con estado `WAITING`, lo marca como `PLAYING` y emite `MATCH_STARTING`.
