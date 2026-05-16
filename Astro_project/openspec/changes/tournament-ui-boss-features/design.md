## Context

El proyecto es un juego multijugador con frontend en Vue.js y backend en Node.js. Utiliza WebSockets para la comunicación en tiempo real y SQL para la persistencia de datos (usuarios, saldo, etc.). Actualmente, faltan mecanismos para gestionar pagos de entrada a eventos, limpieza de estado en la UI y lógicas de juego asimétricas.

## Goals / Non-Goals

**Goals:**
- Implementar un flujo seguro de "Inscripción" que verifique y descuente saldo (SQL).
- Definir un patrón de diseño en Vue para reiniciar componentes de juego a su estado inicial.
- Diseñar la arquitectura de mensajes WebSocket para un "Modo Jefe" dinámico con feed de acciones.

**Non-Goals:**
- Implementar pasarelas de pago reales (Stripe/PayPal); se asume saldo virtual interno.
- Rediseñar el sistema completo de salas; se extenderá el actual.

## Decisions

- **Transacciones SQL para Inscripción**: Para evitar condiciones de carrera (race conditions), se utilizarán transacciones SQL (BEGIN TRANSACTION) al consultar el saldo y restarlo. Esto asegura que un usuario no pueda inscribirse dos veces si hace clic rápido y tiene saldo para una sola.
- **Patrón de Reinicio de UI en Vue**: Se recomienda el uso de una función `resetGame()` que devuelva el estado a sus valores iniciales, o alternativamente, el uso del atributo `:key` en el componente padre para forzar un desmontado y remontado completo del componente del juego, lo que limpia todo rastro de estado anterior de forma nativa en Vue.
- **Gestión de Estado del Jefe en el Servidor**: La vida del Jefe (HP) se gestionará exclusivamente en el servidor (Node.js) para evitar trampas. Los clientes enviarán eventos de "acierto", y el servidor validará y emitirá el nuevo HP a todos.
- **Feed de Acciones**: Se utilizará un sistema de "Eventos de Notificación" vía WebSocket donde el servidor difunde strings descriptivos a todos los clientes en la sala.

## Risks / Trade-offs

- [Riesgo] **Latencia en WebSockets** → [Mitigación] El servidor procesará los ataques en lote o con un pequeño cooldown para no saturar el canal.
- [Riesgo] **Doble cobro en SQL** → [Mitigación] Uso estricto de transacciones y validación de estado en el backend antes de proceder.
- [Riesgo] **Fuga de memoria en Vue** → [Mitigación] Asegurar que el reinicio de UI también limpie event listeners o timers globales (setInterval/setTimeout).
