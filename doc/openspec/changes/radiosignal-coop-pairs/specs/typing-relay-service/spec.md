## ADDED Requirements

### Requirement: Retransmisión de eventos de escritura
El backend SHALL retransmitir cada carácter o cambio en el input del 'Escritor' exclusivamente a su compañero de pareja ('Oyente') en tiempo real.

#### Scenario: Sincronización de texto en vivo
- **WHEN** el 'Escritor' teclea la letra "A" en su campo de entrada.
- **THEN** el sistema envía un mensaje `TYPING_SYNC` al 'Oyente' con el contenido actualizado.

### Requirement: Visualización remota de escritura
El frontend SHALL mostrar el texto que está escribiendo el compañero en una zona dedicada de la pantalla para el jugador que no tiene el input activo.

#### Scenario: Visualización para el Oyente
- **WHEN** el 'Oyente' recibe un evento `TYPING_SYNC`.
- **THEN** el texto recibido se renderiza instantáneamente en su pantalla con un indicador visual de "Compañero escribiendo...".
