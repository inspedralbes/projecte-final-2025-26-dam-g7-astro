## MODIFIED Requirements

### Requirement: Validación cooperativa de RadioSignal
El sistema SHALL validar la respuesta introducida por el 'Escritor' contrastándola con el audio que solo el 'Oyente' puede escuchar. La ronda se considera superada para la PAREJA cuando el 'Escritor' acierta la palabra.

#### Scenario: Acierto por equipo
- **WHEN** el 'Escritor' introduce la palabra correcta guiado por el 'Oyente'.
- **THEN** ambos miembros de la pareja reciben el punto y avanzan al siguiente nivel con inversión de roles.

## ADDED Requirements

### Requirement: Soporte de accesibilidad OpenDyslexic
El minijuego SHALL permitir la activación de la fuente OpenDyslexic en todos los elementos de texto para facilitar la lectura.

#### Scenario: Cambio de fuente
- **WHEN** el usuario activa el modo de accesibilidad.
- **THEN** todos los textos de RadioSignal (incluyendo el texto sincronizado) cambian su familia tipográfica a OpenDyslexic.
