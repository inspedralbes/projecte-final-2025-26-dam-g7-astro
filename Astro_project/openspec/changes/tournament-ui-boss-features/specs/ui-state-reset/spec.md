## ADDED Requirements

### Requirement: Limpieza de Estado de Componente
El sistema DEBE permitir reiniciar todas las variables reactivas de un componente de juego a sus valores iniciales sin necesidad de recargar la página completa.

#### Scenario: Reinicio por Cambio de Key
- **WHEN** se cambia la propiedad `:key` de un componente de Vue.
- **THEN** Vue destruye la instancia anterior y crea una nueva con el estado inicial limpio.

#### Scenario: Reinicio Manual
- **WHEN** se llama a una función de reinicio dedicada en el componente.
- **THEN** todas las variables de puntos, tiempo y progreso vuelven a cero o a sus valores por defecto.
