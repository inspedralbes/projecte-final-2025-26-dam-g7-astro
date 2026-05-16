## MODIFIED Requirements

### Requirement: Feed de Acciones en Tiempo Real
El sistema DEBE mostrar un registro de eventos relevantes para todos los participantes, incluidos los observadores.

#### Scenario: Notificación de Acción
- **WHEN** ocurre un cambio de HP o un ataque de interferencia.
- **THEN** el servidor emite un mensaje de texto descriptivo a toda la sala que los clientes muestran en un componente de "Feed".
