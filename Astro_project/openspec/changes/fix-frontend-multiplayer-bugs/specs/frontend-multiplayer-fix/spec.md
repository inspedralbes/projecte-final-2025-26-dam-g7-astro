## ADDED Requirements

### Requirement: Visibilidad de la palabra en SpelledRosco
El sistema SHALL asegurar que el jugador con el rol 'sender' vea siempre la palabra que debe describir, incluso si los datos se cargan asíncronamente después del montaje del componente.

#### Scenario: Carga tardía de datos del rosco
- **WHEN** el componente se monta pero los datos de la sala aún no contienen `roscoData`
- **THEN** el sistema debe reaccionar automáticamente cuando `roscoData` esté disponible y mostrar la palabra al 'sender'.

### Requirement: Fluidez de audio en RadioSignal
El sistema SHALL permitir clics rápidos en el botón de escuchar sin imponer un tiempo de espera (cooldown) artificial entre reproducciones.

#### Scenario: Clics rápidos en el botón de audio
- **WHEN** el usuario hace clic varias veces seguidas en el botón de escuchar
- **THEN** la síntesis de voz debe reiniciarse inmediatamente con cada clic, cancelando la reproducción anterior si es necesario.

### Requirement: Efecto de iluminación RadarScan compartido
El sistema SHALL mostrar un efecto de linterna que combine las posiciones de todos los jugadores en la sala, restaurando la estética del modo un jugador (gradientes radiales suaves).

#### Scenario: Múltiples jugadores explorando el tablero
- **WHEN** hay varios jugadores moviendo el ratón sobre el tablero de RadarScan
- **THEN** la pantalla debe mostrar áreas iluminadas alrededor de cada cursor, mientras el resto del tablero permanece oscuro, sin que las áreas oscuras de un jugador tapen las áreas iluminadas de otro.

### Requirement: Sincronización de clics y señuelos en RadarScan
El sistema SHALL sincronizar los clics en las letras entre todos los jugadores del equipo y presentar letras señuelo adicionales para aumentar la dificultad en multijugador.

#### Scenario: Sincronización de clic correcto
- **WHEN** un jugador hace clic en su letra objetivo asignada
- **THEN** el sistema envía un evento de sincronización y el compañero ve el feedback visual de acierto en esa posición inmediatamente.

#### Scenario: Presencia de letras señuelo
- **WHEN** se genera el tablero en modo multijugador
- **THEN** el sistema debe incluir al menos 2 caracteres diferentes al 'distractor' y al 'target' en posiciones aleatorias.
