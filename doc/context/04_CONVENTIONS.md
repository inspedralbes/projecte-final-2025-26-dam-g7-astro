# 04_CONVENTIONS: Guia d'Estil i Convencions de Desenvolupament

## 1. Convencions de Nomenclatura (Naming)
Mantenir una nomenclatura consistent és vital per a la llegibilitat del codi.

- **Variables i Funcions:** `camelCase` (ex: `calculateUserXP`, `isOnline`).
- **Classes:** `PascalCase` (ex: `UserService`, `AuthRepository`).
- **Components (Vue/React):** `PascalCase` (ex: `SidebarRight.vue`, `GameCard.js`).
- **Fitxers de Constants:** `SCREAMING_SNAKE_CASE` (ex: `MAX_LEVEL_REACHED`).
- **Base de Dades (MongoDB):** Col·leccions en plural i minúscules (ex: `users`, `partides`).

## 2. Estructura de Components
- **Single Responsibility:** Cada component ha de fer una sola cosa. Si un component de Vue creix massa, s'ha d'extreure la lògica a sub-components o a un `composable`.
- **Props i Events:** Utilitzar noms clars per a les props i emetre esdeveniments amb noms d'acció (ex: `@update:profile`).
- **Estils:** 
    - Prioritzar classes de Vuetify per a layout i espaiat.
    - Per a estils personalitzats, utilitzar blocs `<style scoped>` per evitar col·lisions.
    - Centralitzar colors de la temàtica en variables CSS globals.

## 3. Qualitat del Codi i Bones Pràctiques
- **Internacionalització (i18n):** Prohibit escriure text directament al HTML/Template. Tota cadena ha d'estar al fitxer de traduccions i cridada amb `$t('clau.subclau')`.
- **Comentaris:** Comentar el "perquè" de les funcions complexes, no el "què" fan (el codi ha de ser auto-explicatiu).
- **Gestió d'Errors:** Totes les crides asíncrones han d'estar dins de blocs `try/catch` amb un tractament d'errors adequat per a l'usuari final.

## 4. Control de Versions (Git)
- **Branques:** Utilitzar branques descriptives (ex: `feature/inventory-system`, `fix/login-bug`).
- **Commits:** Seguir el format de commits convencionals: `type(scope): description`.
    - `feat:` Nova funcionalitat.
    - `fix:` Correcció d'errors.
    - `docs:` Canvis en la documentació.
    - `refactor:` Canvis en el codi que no afecten la funcionalitat.

## 5. Desenvolupament amb IA
- L'agent d'IA ha de respectar escrupolosament el fitxer `RULES.md` de la carpeta `Astro_project`.
- Abans de realitzar canvis en rutes d'API o models de dades, s'ha de validar l'impacte en tota la cadena (DB -> Backend -> Frontend).

## 6. Estratègia de Testing de Backend
- **Aïllament:** Cada test ha de crear la seva pròpia instància del servei o gestor (`RoomManager`) per evitar interferències.
- **Repositoris en Memòria:** Utilitzar `InMemoryRoomRepository` i `InMemoryUserRepository` per a tests d'integració ràpids i sense dependències de base de dades externa.
- **Gestió de Timers:** Utilitzar `jest.useFakeTimers()` i avançar-los amb `jest.advanceTimersByTime()` per provar lògiques de timeout sense esperar temps real.
- **Neteja:** Tots els tests han de tindre un `afterEach` que cridi mètodes de parada (`stop()`) per netejar intervals de `setInterval` i evitar que Jest es quedi penjat.

Aquesta guia assegura que la suite de tests sigui ràpida, determinista i fàcil de mantenir.
