## Context

Actualmente, los archivos están organizados por tipo (página, componente, store). El usuario ha solicitado una reestructuración basada en el dominio (modo de juego) para agrupar toda la funcionalidad relacionada en un solo lugar.

## Goals / Non-Goals

**Goals:**
- Agrupar cada modo de juego en su propia carpeta.
- Incluir componentes, lógica y minijuegos específicos dentro de la carpeta del modo.
- Mantener la funcionalidad intacta tras la reubicación.
- Mejorar la escalabilidad para futuros modos de juego.

**Non-Goals:**
- Refactorizar la lógica interna de los minijuegos o los stores.
- Cambiar el dise�o visual de la aplicación.

## Decisions

- **Directorio Raíz de Modos**: Se creará rontend/web/src/modes.
- **Modos Identificados**:
    - 	raining (SinglePlayer)
    - multiplayer
    - educational
    - shared (para recursos comunes entre modos)
- **Estructura Interna de cada Modo**:
    - pages/: Para los componentes que actúan como vistas principales.
    - components/: Para subcomponentes específicos.
    - composables/ o logic/: Para lógica extraída de los componentes.
    - store/: Si el store es de uso exclusivo del modo.
- **Minijuegos Compartidos**: Los minijuegos que se usan tanto en solitario como en multijugador se moverán a src/modes/shared/minigames.
- **Actualización de Router**: El archivo src/router/index.js deberá actualizar sus rutas dinámicas.

## Risks / Trade-offs

- [Risk] **Errores de Importación** → [Mitigación] Uso de búsqueda global para actualizar todos los import y verificación rigurosa post-migración.
- [Risk] **Conflictos con Vite/Webpack** → [Mitigación] Asegurar que los alias de jsconfig.json sigan funcionando o actualizarlos si es necesario.
