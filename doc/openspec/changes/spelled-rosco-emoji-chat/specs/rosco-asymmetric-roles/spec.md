## ADDED Requirements

### Requirement: Control de Roles Asimétricos
El sistema SHALL restringir las acciones del usuario basándose en su sub-rol asignado (`sender` o `guesser`) durante la partida cooperativa de SpelledRosco.

#### Scenario: Interfaz del Emisor
- **WHEN** el usuario tiene el rol 'sender'
- **THEN** el sistema muestra la palabra secreta completa, habilita el selector de emojis y deshabilita el teclado de letras

#### Scenario: Interfaz del Adivinador
- **WHEN** el usuario tiene el rol 'guesser'
- **THEN** el sistema oculta la definición/palabra secreta (mostrando solo la letra inicial), habilita el teclado de letras y muestra el historial de emojis recibidos
