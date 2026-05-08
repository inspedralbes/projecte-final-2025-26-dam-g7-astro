# 03_DECISIONS: Registre de Decisions Arquitectòniques (ADR)

Aquest document recull el "perquè" de les eleccions tècniques i canvis estructurals significatius fets durant el cicle de vida del projecte Astro.

## 1. Simplificació de la Gamificació (Maig 2026)
- **Decisió:** Eliminar el sistema de Mascotes i consolidar la progressió en Rangs, Títols i Avatars.
- **Racional:** Les mascotes afegien una capa de complexitat innecessària que distraia de l'objectiu principal d'entrenament cognitiu. La nova estructura és més neta i se centra en l'assoliment personal.

## 2. Implementació de la "Account Danger Zone" (Maig 2026)
- **Decisió:** Afegir un sistema de sol·licitud d'eliminació de compte amb un període de caràcia de 30 dies.
- **Racional:** Complir amb les bones pràctiques de UX i seguretat de dades, permetent a l'usuari penedir-se de l'acció abans que el procés sigui irreversible al backend.

## 3. Adopció de Pinia per al Frontend Web
- **Decisió:** Utilitzar Pinia en lloc de Vuex.
- **Racional:** Pinia ofereix una millor experiència de desenvolupament amb Vue 3, suport natiu per a TypeScript i una sintaxi molt més simplificada (Composition API).

## 4. Estratègia de "Plan First" amb Agents d'IA
- **Decisió:** Obligació de l'agent d'IA de generar un Markdown de planificació abans de tocar codi.
- **Racional:** Minimitzar errors en projectes complexos on canvis en el backend afecten múltiples components del frontend.

## 5. Implementació de Raches (Streaks) de 24 hores
- **Decisió:** Dissenyar un motor de raches basat en timestamps exactes.
- **Racional:** Per fomentar la recurrència real, el sistema verifica que l'usuari hagi jugat en les últimes 24 hores, oferint ítems de "Streak Freeze" per evitar la frustració en cas de pèrdua accidental.

## 6. Selecció d'Estètica Glassmorphism
- **Decisió:** Utilitzar capes translúcides i desenfocaments (backdrop-filter).
- **Racional:** Crear una sensació de profunditat espacial i modernitat que diferenciï Astro d'altres aplicacions educatives més planes i convencionals.
