## Context

El sistema multijugador utiliza un temporizador centralizado en el servidor. Actualmente, los aciertos solo pueden extender el tiempo global de la sala, pero no realizar transferencias entre jugadores individuales en un duelo.

## Goals / Non-Goals

**Goals:**
- Establecer 150s como tiempo base para duelos 1vs1.
- Implementar transferencia de +/- 3s por acierto en 1vs1.
- Bloquear el inicio del modo 2vs2 si los equipos no son de exactamente 2 personas.

**Non-Goals:**
- Cambiar el tiempo en modos de más de 2 jugadores (excepto torneos que son 1vs1).
- Modificar el sistema de puntuación (XP/monedas).

## Decisions

- **Identificación de Duelo**: Se considera duelo 1vs1 si oom.players.size === 2 y no es modo carrera o jefe.
- **Lógica de Transferencia**:
    - Al recibir SCORE_UPDATE de UserA:
        - oom.roundEndTime += 3000 (Suma al tiempo global, pero el frontend de UserA lo verá como ganancia).
        - *Nota*: Dado que el oundEndTime es compartido, para que sea un "robo", debemos afectar la visualización o tener tiempos individuales. 
        - **Corrección de decisión**: Como el tiempo es una propiedad de la SALA (oom.roundEndTime), en un 1vs1 el tiempo es compartido. Si UserA acierta, gana tiempo para ambos. Para que sea un robo real, UserA debe acercarse a la victoria y UserB quedarse sin tiempo. 
        - **Refinamiento**: En el sistema actual de Astro, la ronda termina cuando el tiempo llega a 0. El que tiene más puntos gana. Si UserA acierta, sumarle tiempo le da más margen para puntuar, pero también a UserB.
        - **Nueva Decisión**: Para cumplir el requerimiento de "restar al rival", se aplicará un efecto de **penalización de tiempo** al oponente: el acierto de UserA sumará 3s al tiempo total, pero el fallo de UserB podría restar. 
        - **Si el usuario insiste en "sumar a uno y restar a otro"** en un tiempo compartido, la única forma es que cada uno tenga su propio 	imeLeft en oom.gameConfig.playerTimes.
- **Validación de Equipos**: En startMatch, si hay equipos definidos, verificar que cada 	eamId tenga exactamente 2 miembros.

## Risks / Trade-offs

- [Risk] **Confusión con tiempo compartido** → [Mitigación] Se implementarán tiempos individuales en el estado de la sala para el modo Duelo para que el "robo" sea efectivo.
