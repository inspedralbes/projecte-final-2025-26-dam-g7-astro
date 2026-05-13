# Astro: Plataforma de Gamificació i Entrenament Cognitiu 🚀

[![Status](https://img.shields.io/badge/Status-In--Development-orange.svg)]()
[![DAM](https://img.shields.io/badge/DAM-G7-blue.svg)]()
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

**Astro** és un ecosistema multiplataforma (Web i Mòbil) dissenyat per potenciar les habilitats cognitives dels usuaris mitjançant minijocs immersius. Ambientat en una estètica espacial futurista, el projecte combina el rigor dels exercicis mentals amb la potència de la gamificació moderna.

## 👥 L'Equip (DAM-G7)
Aquest projecte ha estat desenvolupat pels següents integrants del cicle de Desenvolupament d'Aplicacions Multiplataforma:
*   **Kim Galicio**
*   **Pau Uclés**
*   **Joel Chica**
*   **Biel Calvet**
*   **Enrique Cayo**

## 🌌 Visió del Projecte
L'objectiu d'Astro és transformar l'entrenament mental en una aventura galàctica. Els usuaris, anomenats "Pilots", progressen a través d'una jerarquia militar espacial completant missions diàries, guanyant XP i gestionant el seu propi inventari de suministres.

### Característiques Principals:
- **Entrenament Adaptatiu:** Minijocs dissenyats per estimular la memòria, atenció i velocitat.
- **Sistema de Raches (Streaks):** Motor en temps real que fomenta la constància diària.
- **Economia Galàctica:** Botiga d'ítems, avatars personalitzables i títols honorífics.
- **Competició Social:** Desafiaments multijugador i llistes d'amics sincronitzades.
- **Interfície Modernista:** Estètica *Glassmorphism* amb efectes de neó i profunditat.

## 🛠️ Stack Tecnològic
Astro utilitza una arquitectura de micro-serveis contenidoritzats per garantir escalabilitat i rendiment.

| Capa | Tecnologia |
| :--- | :--- |
| **Frontend Web** | [Vue 3](https://vuejs.org/) + [Vuetify](https://vuetifyjs.com/) + [Pinia](https://pinia.vuejs.org/) |
| **Frontend Mòbil** | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) + [Zustand](https://github.com/pmndrs/zustand) |
| **Backend** | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) + **WebSockets (ws)** |
| **Testing** | **Jest** (Backend) + **Vitest** (Frontend) |
| **Base de Dades** | [MongoDB](https://www.mongodb.com/) (Driver Natiu) |
| **Infraestructura** | [Docker](https://www.docker.com/) + [Nginx](https://www.nginx.com/) |
| **CI/CD** | **GitHub Actions** |

## 📂 Estructura del Repositori
- **[`/Astro_project`](./Astro_project)**: Codi font de l'ecosistema (Web, Mobile i Backend).
- **[`/doc`](./doc)**: Punt d'entrada a la **Documentació Tècnica**, presentacions comercials, tècniques i manual d'usuari.
- **[`/doc/context`](./doc/context)**: Cervell del projecte amb guies d'arquitectura i convencions.

## 🔗 Recursos i Enllaços
- **Gestió de Tasques:** [Taiga Project - Astro](https://taiga.io/)
- **Disseny Gràfic:** [Figma - Prototip Astro](https://figma.com/)
- **Entorn de Dev:** Executa `docker-compose -f Astro_project/docker-compose.dev.yml up` per aixecar l'entorn.

## 📈 Estat de Desenvolupament
- [x] **Sprint 1:** Arquitectura base i contenidors Docker.
- [x] **Sprint 2:** Sistema d'autenticació i gestió de perfils.
- [x] **Sprint 3:** Motor de raches, missions i economia (Botiga/Inventari).
- [ ] **Sprint 4:** Multijugador en temps real i xat. (En procés)
- [ ] **Sprint 5:** Optimització mòbil i preparació per a producció.

---
© 2026 **DAM-G7** - Institut Pedralbes. Tots els drets reservats.
