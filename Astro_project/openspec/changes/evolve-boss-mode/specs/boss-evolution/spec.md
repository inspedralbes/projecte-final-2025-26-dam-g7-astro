## ADDED Requirements

### Requirement: Salud Fraccionada de Héroes
El sistema DEBE gestionar la vida de los héroes en unidades de 1/4 de corazón.

#### Scenario: Recibir Daño Directo
- **GIVEN** un héroe con 3 corazones (12 unidades).
- **WHEN** el jefe activa el "Agujero Negro".
- **THEN** el héroe pierde 1 unidad (quedando con 2 y 3/4 corazones).

#### Scenario: Eliminación
- **WHEN** la vida de un héroe llega a 0 unidades.
- **THEN** el sistema debe marcar al héroe como eliminado y notificar a la sala.

### Requirement: Arsenal del Jefe con Cooldown
El jefe DEBE tener acceso a habilidades tácticas limitadas por tiempo.

#### Scenario: Uso de Habilidad
- **WHEN** el jefe presiona un botón de ataque y el cooldown global ha expirado.
- **THEN** el sistema ejecuta el ataque y reinicia el contador de 30 segundos para TODAS las habilidades.

#### Scenario: Habilidad Bloqueada
- **WHEN** el jefe intenta atacar antes de que pasen los 30 segundos.
- **THEN** el sistema ignora la petición y mantiene el estado actual.

### Requirement: Integración de Anomalías Existentes
El sistema DEBE permitir disparar efectos visuales y mecánicos ya definidos en el proyecto.

#### Scenario: Lluvia de Relámpagos
- **WHEN** el jefe activa "Lluvia de Relámpagos".
- **THEN** se dispara el evento `TRIGGER_ANOMALY` que activa el componente `GlobalAnomalyManager` en todos los clientes de los héroes.
