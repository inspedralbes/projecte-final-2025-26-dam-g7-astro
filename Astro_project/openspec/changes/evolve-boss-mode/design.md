## Context

El modo jefe actual es funcional pero básico. Los héroes atacan al jefe al acertar, pero el jefe tiene poco control táctico. Queremos mover la iniciativa del jefe a un sistema de recursos (tiempo) y la de los héroes a una de resistencia (corazones).

## Goals / Non-Goals

**Goals:**
- Implementar vida fraccionada para héroes (3 corazones = 12 unidades de 1/4).
- Crear un panel de control para el jefe con 4 habilidades.
- Implementar un cooldown global de 30 segundos compartido entre todas las habilidades del jefe.
- Integrar la "Lluvia de relámpagos" de `GlobalAnomalyManager.vue`.

**Non-Goals:**
- Cambiar la lógica de ataque de los héroes al jefe (se mantiene el 2% por acierto).
- Implementar nuevos minijuegos; se usan los existentes.

## Decisions

- **Estado en Servidor**: `RoomManager.js` mantendrá un objeto `heroHealth` (username -> hearts) dentro de la configuración de la sala al iniciar el modo jefe.
- **Cooldown en Cliente y Servidor**: El panel del jefe mostrará el cooldown visualmente, pero el servidor también validará que hayan pasado 30s desde el último `BOSS_ATTACK` para evitar trampas.
- **Mapeo de Ataques**:
    - `BLACK_HOLE`: Emite `APPLY_DAMAGE` a todos los héroes (-1/4 corazón).
    - `LIGHTNING_STORM`: Emite `TRIGGER_ANOMALY` con tipo `raig-tempesta`.
    - `FREEZE`: Emite `APPLY_INTERFERENCE` tipo `FREEZE` (2s).
    - `ZERO_GRAVITY`: Emite `APPLY_INTERFERENCE` tipo `SCRAMBLE` (desordena letras en juegos de palabras).
- **Eliminación**: Cuando un héroe llega a 0 corazones, el servidor emite `HERO_ELIMINATED`. El cliente del héroe mostrará una pantalla de "Derrotado" y dejará de enviar ataques.

## Risks / Trade-offs

- [Riesgo] **Diferencia de latencia en rayos** → [Mitigación] La animación de rayos en `GlobalAnomalyManager` es local, pero el daño se procesa si el ratón está en la zona. Para el modo jefe, podríamos simplificarlo a daño directo o asegurar que el evento se sincronice bien.
- [Riesgo] **Abuso de Gravedad Cero** → [Mitigación] El cooldown de 30s es suficientemente largo para no arruinar la experiencia de juego.
