## ADDED Requirements

### Requirement: Integrated Mini-chat in Radio Signal
La interfaz de Radio Signal DEBE incluir un sistema de chat de texto simplificado para la coordinación táctica.

#### Scenario: Sending a message
- **WHEN** un jugador escribe un mensaje en el mini-chat de la radio y pulsa enviar
- **THEN** el mensaje aparece instantáneamente en la pantalla del compañero

#### Scenario: Real-time synchronization
- **WHEN** se recibe un evento 'RADIO_CHAT' desde el servidor
- **THEN** el componente actualiza la lista de mensajes mostrados en la interfaz
