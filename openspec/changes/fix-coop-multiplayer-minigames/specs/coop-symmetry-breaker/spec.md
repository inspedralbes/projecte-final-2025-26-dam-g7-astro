## ADDED Requirements

### Requirement: Sincronización de cursor doble en SymmetryBreaker
El minijuego SymmetryBreaker en modo cooperativo DEBERÁ sincronizar y renderizar el cursor de ambos compañeros en la cuadrícula de simetría.

#### Scenario: Visualización del cursor del compañero
- **WHEN** el compañero mueve su cursor sobre la pantalla
- **THEN** el jugador local ve el puntero del compañero desplazarse sobre la cuadrícula en tiempo real.

### Requirement: Puntuación por coincidencia simultánea en objetivo correcto
Ambos jugadores DEBERÁN apuntar o hacer clic sobre el objetivo correcto al mismo tiempo para poder anotar puntos y avanzar de nivel.

#### Scenario: Coincidencia en objetivo correcto
- **WHEN** ambos jugadores posicionan sus cursores sobre el objetivo correcto simultáneamente
- **THEN** se otorga el punto al equipo, se avanza al siguiente nivel y se muestra la respuesta como correcta.
