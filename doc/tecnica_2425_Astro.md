---
marp: true
theme: default
class: lead
backgroundColor: #2b2b2b
color: #e0e0e0
---

# 🛠️ Astro: Presentació Tècnica
**Equip:** DAM-G7
**Arquitectura i Desenvolupament**

---

# 1. Evolució de les Funcionalitats (Sprints) 🏃‍♂️

- **Sprint 1: Fonaments i Docker.** Configuració de l'arquitectura base de micro-serveis, inicialització del repositori i orquestració amb `docker-compose`.
- **Sprint 2: Seguretat i Perfils.** Implementació de l'autenticació (JWT) i la creació de la base de dades a MongoDB (esquemes de Mongoose per a Usuaris).
- **Sprint 3: Nucli de Joc i Economia.** Desenvolupament del motor de Raches (Streaks) en el backend. Creació de la Botiga (sense elements d'atzar/ruleta) i inventari tàctic.
- **Sprint 4: Social i Temps Real.** Integració de WebSockets (Socket.io) per veure l'estat d'amics (Online/Offline) i sincronització de títols ("El Imparable").
- **Sprint 5: Poliment UI.** Optimització de la responsivitat dels minijocs (SyllableQuest) per evitar encavalcaments al `v-main` de Vuetify i resolució d'errors d'importació (Vite).

---

# 2. Problemes i Solucions Tècniques 🔧

**Problema 1: Responsivitat i retallada visual als Minijocs**
- *Context:* El contenidor dels minijocs (com SyllableQuest i SpelledRosco) es retallava per la part inferior i s'encavalcava amb el sidebar a resolucions petites.
- *Solució:* Refactorització del CSS aplicant Flexbox i `overflow-y: auto`, ajustant les altures relatives (`vh`) dins del component `v-main` de Vuetify per garantir una bona visualització a mòbil i web.

**Problema 2: Dependències i Caigudes en el Build (Vite + Vue-I18n)**
- *Context:* Error `[plugin:vite:import-analysis]` a `RightSidebar.vue` a causa d'una resolució incorrecta de dependències en calent.
- *Solució:* Neteja de la memòria cau de Vite, comprovació de l'estructura d'imports del plugin de traducció (i18n) i fixació de les versions al `package.json`.

**Problema 3: Redisseny de la Botiga per problemes ètics**
- *Context:* La versió inicial incloia una "Ruleta" d'atzar, la qual podia incitar a la ludopatia, allunyant-se del públic objectiu educatiu.
- *Solució:* Eliminació completa del component `LuckyWheel` al frontend i del seu controlador al backend. Transició a una botiga de compra directa d'ítems tàctics.

---

# 3. Aspectes i Requisits Tècnics 💻

**Arquitectura General:**
Sistema basat en Micro-serveis contenidoritzats.
- **Frontend Web:** Desenvolupat amb Vue 3 (Composition API), gestionant l'estat global amb Pinia i la interfície amb Vuetify 3 (estètica Glassmorphism).
- **Backend / API:** API REST construïda amb Node.js i Express. 
- **Temps Real:** Comunicació bidireccional establerta amb **WebSockets (ws)** per al Social Hub i Multijugador.
- **Base de Dades:** MongoDB (NoSQL) escollida per la flexibilitat d'emmagatzemar estructures complexes. Driver natiu.
- **Qualitat:** Cobertura de tests amb **Jest** (Backend) i **Vitest** (Frontend).
- **Desplegament:** Orquestració mitjançant **Docker** i automatització amb **GitHub Actions**.
