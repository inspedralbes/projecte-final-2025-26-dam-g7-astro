## ADDED Requirements

### Requirement: Inversión Dinámica de Roles
El servidor SHALL invertir los roles de 'Traductor' y 'Adivinador' a mitad de la partida o tras un umbral de fallos para garantizar la participación de ambos jugadores.

#### Scenario: Inversión en mitad del abecedario
- **WHEN** la pareja avanza a la letra 'M' o 'N' (mitad lógica del rosco)
- **THEN** los roles se intercambian automáticamente y se notifica a los clientes para actualizar la interfaz
