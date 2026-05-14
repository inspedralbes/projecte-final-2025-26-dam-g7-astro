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
## 7. Refactorització de RoomManager per a Testabilitat (Maig 2026)
- **Decisió:** Permetre la instanciació de la classe `RoomManager` en lloc de dependre exclusivament d'un singleton global, i afegir mètodes de control de cicle de vida com `stop()`.
- **Racional:** La dependència de singletons dificultava el testatge paral·lel i causava "leaks" de memòria i interferències entre tests degut als intervals actius (Garbage Collector). Aquesta modularització permet proves unitàries aïllades i deterministes.

## 8. Prescindir d'Aplicacions Mòbils Natives (Maig 2026)
- **Decisió:** Eliminar l'aplicació Expo / React Native i centrar-se exclusivament en una aplicació Web Responsiva.
- **Racional:** Es va avaluar que l'esforç de mantenir dues codebases no estava justificat donada la capacitat de Vue i Vuetify per oferir una experiència excel·lent a dispositius mòbils a través del navegador.

## 9. Substitució de Socket.io i Mongoose per llibreries natives (Maig 2026)
- **Decisió:** Utilitzar la llibreria nativa `ws` per a WebSockets i el driver natiu de `mongodb`, en lloc de Socket.io i Mongoose.
- **Racional:** Socket.io i Mongoose afegien sobrecàrrega innecessària. Prescindir-ne redueix la dependència de paquets grans i ofereix un millor control sobre el rendiment (especialment per a entorns de temps real) i l'arquitectura de base de dades.
