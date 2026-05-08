## ADDED Requirements

### Requirement: Temporizador Autoritativo del Host
En las partidas multijugador, el tiempo de la ronda SHALL ser dictado por el Host. El Host enviará actualizaciones periódicas del tiempo restante para asegurar que todos los clientes estén sincronizados.

#### Scenario: Sincronización de Tiempo al Inicio
- **WHEN** comienza una ronda multijugador
- **THEN** el Host emite un mensaje con la marca de tiempo de inicio (`startTime`) y la duración total, permitiendo que los clientes calculen el tiempo restante de forma idéntica.

### Requirement: Resiliencia a Inactividad de Pestaña (Anti-Tab-Freeze)
El sistema SHALL calcular el tiempo restante basándose en la diferencia entre el tiempo actual (`Date.now()`) y el tiempo de inicio de la ronda, en lugar de depender únicamente de `setInterval`. Esto asegura que el tiempo siga bajando incluso si el navegador pausa los timers de fondo.

#### Scenario: Recuperación tras Cambio de Pestaña
- **WHEN** un jugador vuelve a la pestaña del juego tras 5 segundos de inactividad
- **THEN** el temporizador se actualiza instantáneamente a la posición correcta reflejando los 5 segundos transcurridos.
