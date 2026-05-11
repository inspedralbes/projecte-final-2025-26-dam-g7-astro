## ADDED Requirements

### Requirement: Sincronización en vivo del tecleo en el Rosco
El sistema SHALL retransmitir el texto introducido por el 'Adivinador' al 'Traductor' en tiempo real usando los mecanismos de WebSocket.

#### Scenario: Retransmisión de texto del Adivinador
- **WHEN** el 'Adivinador' teclea en el input del rosco
- **THEN** el 'Traductor' visualiza exactamente lo mismo con un indicador visual de que el compañero está escribiendo
