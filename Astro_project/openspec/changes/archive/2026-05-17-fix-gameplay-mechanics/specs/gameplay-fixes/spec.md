## ADDED Requirements

### Requirement: Dial Control Damping and Tuning Lock Debounce
La sintonización de la radio debe ser fluida, analógica y libre de bloqueos falsos o ruidosos mientras el usuario está girando activamente el dial.

#### Scenario: Smooth Dial Rotation
- **WHEN** El usuario arrastra el dial de la radio de izquierda a derecha.
- **THEN** La frecuencia y la rotación del dial cambian de manera suavizada y progresiva mediante amortiguación matemática (damping).

#### Scenario: Stabilization Tuning Lock
- **WHEN** El usuario pasa rápidamente por la frecuencia correcta sin detenerse.
- **THEN** La señal de la radio no se sintoniza ni se bloquea de forma inmediata, evitando alertas audibles o visuales falsas.

#### Scenario: Stationary Lock
- **WHEN** El usuario se detiene dentro del umbral de sintonización de la frecuencia correcta por más de 700ms, o suelta el control deslizante dentro de dicho rango.
- **THEN** La radio se bloquea y se activa la entrada de transmisión de voz y texto.

### Requirement: Spelled Rosco Time Bonus
Completar un rosco de palabras debe recompensar la velocidad del jugador con tiempo de bonificación extra en su cuenta.

#### Scenario: Complete Rosco Bonus
- **WHEN** El usuario responde o pasa la última palabra pendiente del rosco (completándolo con o sin errores).
- **THEN** Se le otorgan +20 segundos de bonificación adicionales y se inicia una nueva ronda de palabras si aún le queda tiempo.

### Requirement: Rhyme Squad Laser Boundary and Smooth Hover
El juego de las rimas debe tener una barrera límite clara y visible, y una respuesta interactiva al ratón fluida y sin temblores.

#### Scenario: Laser Boundary Collision
- **WHEN** Una palabra que es una rima correcta cruza la línea límite visual roja a y = 570px sin haber sido atrapada por el jugador.
- **THEN** El jugador recibe daño directo (pierde una vida) y la palabra es destruida.

#### Scenario: Hover Without Jitter
- **WHEN** El usuario pasa el ratón por encima de una rima que está cayendo.
- **THEN** La burbuja de la palabra se escala de forma suave mediante CSS sin causar conflicto de transformaciones ni loops infinitos de entrada/salida (jitter).

### Requirement: Syllable Quest Competitive 1vs1 and Singleplayer Feedback
El minijuego de sílabas en singleplayer debe proporcionar alertas correctas y avanzar, y en 1vs1 competitivo debe jugar la modalidad clásica de contar sílabas de forma sincrónica.

#### Scenario: Correct Syllable Guess and Next Word
- **WHEN** El jugador acierta la cantidad de sílabas en un jugador y pulsa comprobar.
- **THEN** Se reproduce un feedback de acierto, se muestra el overlay de correcto y el juego avanza automáticamente a la siguiente palabra tras 1 segundo.

#### Scenario: Competitive Syllables 1vs1 Mode
- **WHEN** La partida de multijugador es de modalidad 1vs1, duelo, carrera o torneo.
- **THEN** El juego presenta a cada jugador el reto clásico competitivo de contar sílabas en lugar del reto cooperativo de ordenación de frases.
