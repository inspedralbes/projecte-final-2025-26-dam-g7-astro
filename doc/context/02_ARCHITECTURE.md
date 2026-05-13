# 02_ARCHITECTURE: Arquitectura Tècnica i Stack de Desenvolupament

## 1. Arquitectura de Nivells
Astro utilitza una arquitectura desacoblada basada en serveis que permet la independència del client i la centralització de la lògica de negoci al backend.

### 1.1. Capa de Presentació (Frontend)
- **Web App:** Single Page Application (SPA) construïda amb **Vue 3**. Utilitza **Vuetify 3** per a una interfície d'usuari responsiva i **Pinia** per a la gestió d'estat reactiva.

### 1.2. Capa de Lògica (Backend)
- **Servidor d'Aplicacions:** Node.js amb Express. Implementa un patró de **Repositoris i Serveis** per separar l'accés a dades de la lògica de negoci.
- **Comunicació en Temps Real:** Integració de **ws (WebSockets)** per gestionar connexions bidireccionals persistents.

### 1.3. Capa de Dades (Persistence)
- **Base de Dades NoSQL:** MongoDB. Ideal per a l'estructura flexible de dades d'usuaris, inventaris i historial de jocs.
- **Driver de BD:** Driver natiu de MongoDB, prescindint d'ORMs pesats com Mongoose per obtenir més rendiment i control de les dades.

## 2. Stack Tecnològic Detallat
| Tecnologia | Propòsit |
| :--- | :--- |
| **Node.js / Express** | Runtime de backend i framework web. |
| **Vue 3 (Composition API)** | Framework reactiu per a la interfície web. |
| **MongoDB** | Emmagatzematge persistent de dades (Driver Natiu). |
| **ws** | Protocol i llibreria per a funcionalitats en temps real (WebSockets). |
| **Pinia** | Gestió de l'estat global a la web. |
| **Docker / Compose** | Contenidorització i orquestració d'entorns. |
| **Nginx** | Reverse proxy, balanceig de càrrega i terminació SSL. |

## 3. Estratègia de Desplegament (DevOps)
- **Contenidorització:** Tota l'aplicació està modularitzada en contenidors Docker (Frontend, Backend, DB).
- **Entorns:** Configuracions separades per a `development` i `production` mitjançant fitxers `.env` i `docker-compose`.
- **Proxy Invers:** Nginx actua com a única porta d'entrada, redirigint el trànsit `/api` al backend i la resta al frontend web, garantint seguretat i eficiència.

## 4. Seguretat i Autenticació
- Autenticació basada en sessions/tokens (JWT o similar).
- Protecció de rutes sensibles al frontend i backend.
- Xifratge de contrasenyes mitjançant algorismes de hashing (bcrypt).
