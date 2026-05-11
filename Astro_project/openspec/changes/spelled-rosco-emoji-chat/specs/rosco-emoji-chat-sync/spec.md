## ADDED Requirements

### Requirement: Sincronización de Chat de Emojis
El sistema SHALL permitir el envío de emojis desde el 'Emisor' hacia el 'Adivinador' de la misma pareja en tiempo real mediante WebSockets.

#### Scenario: Envío exitoso de emoji
- **WHEN** el Emisor selecciona un emoji del panel y lo envía
- **THEN** el sistema retransmite el emoji únicamente al compañero de equipo (mismo `teamId`) y se muestra en su burbuja de chat
