## ADDED Requirements

### Requirement: Gestión de HP del Jefe
El servidor DEBE mantener el estado centralizado de la vida del Jefe y actualizarla basándose en los aciertos de los héroes.

#### Scenario: Ataque de Héroe
- **WHEN** un héroe acierta un ejercicio y envía el evento al servidor.
- **THEN** el servidor resta un 2% de la vida total del Jefe y emite el nuevo valor a todos los jugadores.

### Requirement: Interferencia del Jefe
El sistema DEBE permitir que el Jefe lance ataques que afecten la visibilidad o interacción de los héroes.

#### Scenario: Ataque de Congelación
- **WHEN** el Jefe acierta un ejercicio y activa la interferencia.
- **THEN** el servidor envía un evento a todos los héroes para bloquear su interfaz durante 2 segundos.

### Requirement: Feed de Acciones en Tiempo Real
El sistema DEBE mostrar un registro de eventos relevantes para todos los participantes.

#### Scenario: Notificación de Acción
- **WHEN** ocurre un cambio de HP o un ataque de interferencia.
- **THEN** el servidor emite un mensaje de texto descriptivo que los clientes muestran en un componente de "Feed".
