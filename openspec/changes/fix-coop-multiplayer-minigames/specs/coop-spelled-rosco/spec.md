## ADDED Requirements

### Requirement: Entrega en tiempo real de pistas del Rosco
En SpelledRosco 2vs2 cooperativo, cuando el emisor (`sender`) envía una pista o definición para la letra activa, la pantalla del adivinador (`guesser`) DEBERÁ recibir y mostrar la pista en tiempo real de forma inmediata.

#### Scenario: Recepción instantánea de definición
- **WHEN** el emisor escribe una pista para la letra actual y la envía
- **THEN** el adivinador recibe y visualiza la definición en su panel, habilitándose la opción de introducir la respuesta correspondiente.
