# Regles del Projecte: Astro (Entrenament Cognitiu)

Aquest document defineix el contracte de treball entre el desenvolupador i l'agent d'IA. L'objectiu és garantir la coherència arquitectònica, minimitzar errors i assegurar que l'IA actua com un col·laborador tècnic, no com un improvisador.

## 1. Metodologia de Treball: "Planificar abans d'Executar"

### 1.1. El Mode Pla (Plan Mode)
- **Obligatori:** Abans de generar qualsevol codi, l'agent ha de presentar un pla en Markdown.
- **Contingut del pla:** Anàlisi de fitxers afectats, lògica a implementar i com es verificaran els canvis.
- **Aprovació:** No es pot modificar el codi fins que el desenvolupador hagi validat el pla.
- **Fracàs:** Si una solució no funciona, no iteris sobre el codi. Torna al pla, corregeix l'estratègia i re-executa.

### 1.2. Separació de Tasques
- **IA Inicial (Arquitecte):** S'utilitza per definir l'estructura de nous mòduls o minijocs. Genera el Markdown de disseny.
- **Agent d'IA (Execució):** Implementa el codi seguint estrictament el disseny previ. No té permís per prendre decisions arquitectòniques unilaterals.

---

## 2. Stack Tecnològic i Restriccions (No Negociables)

L'agent ha de respectar les següents tecnologies per evitar "al·lucinacions" de versions:

### 🌐 Backend
- **Core:** Node.js + Express.
- **Base de Dades:** MongoDB Atlas.
- **Comunicació:** WebSockets per a funcionalitats en temps real.
- **Funcions:** Lògica centralitzada de XP, monedes, raches i inventari.

### 💻 Frontend Web
- **Framework:** Vue 3 (Composition API).
- **UI:** Vuetify.
- **Estat:** Pinia.
- **Rutes:** Vue Router.

### 📱 Frontend Mòbil
- **Framework:** Expo (React Native).
- **Estat:** Zustand.

### 🎨 Temàtica i UX
- **Context:** Temàtica espacial ("Astro"). Tota la interfície ha de ser gamificada.
- **UX:** Abans d'implementar pantalles noves, l'agent ha de proposar el layout visual o basar-se en els prototips existents.

---

## 3. Gestió del Context i Converses

- **Cicle de vida de la conversa:**
    - Inicia una conversa nova per a cada unitat lògica (ex: "Nou minijoc", "Sistema de logros").
    - Si l'agent entra en bucle d'errors o perd el focus, reinicia la conversa immediatament.
- **Context dinàmic:**
    - No cal carregar tots els fitxers manualment. Deixa que l'agent utilitzi la cerca semàntica.
    - Indica fitxers específics només quan sàpigues que són crítics.

---

## 4. Desenvolupament Dirigit per Tests (TDD)

Per a cada funcionalitat nova (especialment al backend i minijocs):
1. **Definir Test:** Escriure els tests de la funcionalitat (unitaris o d'integració).
2. **Confirmar Fallada:** Executar els tests i veure'ls fallar.
3. **Implementar:** Demanar a l'agent que escrigui el codi necessari per passar els tests.
4. **Validar:** Executar i iterar fins al verd.
5. **Revisió Humana:** El desenvolupador ha de validar el codi final (el "sembla correcte" no és suficient).

---

## 5. Convencions de Codi

- **Nomenclatura:** 
    - Variables i funcions: `camelCase`.
    - Components: `PascalCase`.
    - Idioma del codi: **[TRIAR: Català o Anglès]** (Mantenir coherència amb el codi existent).
- **Estructura:**
    - Prioritzar components curts i reutilitzables.
    - No crear fitxers monolítics; dividir si la complexitat creix.

---

## 6. Validació Final

L'agent té l'obligació de:
1. Validar els canvis visuals mitjançant el navegador integrat (si està disponible).
2. Comprovar que no hi hagi regressions en el sistema de gamificació (XP/Monedes).
3. Informar si una restricció tècnica entra en conflicte amb una petició de l'usuari.
