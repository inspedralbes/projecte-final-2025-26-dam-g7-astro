## ADDED Requirements

### Requirement: Roles Asimétricos del Rosco
El sistema SHALL renderizar la interfaz de forma condicional basándose en el sub-rol del jugador ('Traductor' o 'Adivinador').

#### Scenario: Interfaz del Adivinador
- **WHEN** el jugador tiene el rol 'Adivinador'
- **THEN** se muestra un campo de texto habilitado para escribir y NO se muestran los emojis jeroglíficos

#### Scenario: Interfaz del Traductor
- **WHEN** el jugador tiene el rol 'Traductor'
- **THEN** se muestran los emojis jeroglíficos y NO se muestra el campo de entrada de texto habilitado
