## ADDED Requirements

### Requirement: Inversión de Roles tras Acierto
El sistema SHALL intercambiar los sub-roles de la pareja automáticamente después de que el 'Adivinador' confirme una respuesta correcta para la letra actual.

#### Scenario: Intercambio automático
- **WHEN** el Adivinador acierta una palabra y el sistema avanza a la siguiente letra
- **THEN** el antiguo 'sender' se convierte en 'guesser' y el antiguo 'guesser' se convierte en 'sender', notificando a ambos clientes del cambio de UI
