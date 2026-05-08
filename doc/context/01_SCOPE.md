# 01_SCOPE: Definició de l'Abast del Sistema

## 1. Mòdul de Frontend Web (Core Experience)
El frontend web és el centre neuràlgic de l'experiència Astro, construït amb **Vue 3** i **Vuetify**.

- **Dashboard de Control:** Visualització de mètriques, nivell de XP, raches actuals i missions pendents.
- **Catàleg de Minijocs:** Interfície d'accés als diferents reptes cognitius amb trackeig de puntuacions màximes.
- **Sistema de Gestió de Perfil:** Personalització d'avatars de la "flota", selecció de títols honorífics i gestió de seguretat.
- **Botiga Galàctica i Inventari:** Adquisició de potenciadors (boosters) i consumibles mitjançant monedes virtuals obtingudes jugant.
- **Social Hub:** Gestió de sol·licituds d'amistat, llista de contactes online i xat (si s'escau).
- **Panell de Configuració Avançat:** Control de preferències d'idioma, interfície visual i seguretat del compte.

## 2. Mòdul Frontend Mòbil (Mobility)
Desenvolupat amb **Expo (React Native)** per oferir portabilitat.

- **Accés Ràpid a Minijocs:** Experiència optimitzada per a sessions curtes d'entrenament.
- **Notificacions Push:** Recordatoris per mantenir la racha i alertes de desafiaments d'amics.
- **Sincronització Global:** Accés a l'inventari i estat del compte compartit amb la versió web.

## 3. Core Backend & API Services
Motor central basat en **Node.js** i **Express**.

- **API RESTful:** Endpoints per a la gestió d'usuaris, autenticació, transaccions de botiga i persistència de partides.
- **Real-Time Engine (WebSockets):** Gestió de l'estat online dels pilots i orquestració de desafiaments multijugador.
- **Motor de Progressió:** Algorismes per al càlcul de pujada de nivell, XP requerit i assignació de rangs.
- **Gestió de Suministres (Supplies):** Sistema de distribució d'ítems per a usuaris registrats.

## 4. Administració i Gestió (B2B/Educational)
Funcionalitats per a rols de gestió.

- **Gestió de Grups/Aules:** Creació de grups per a centres educatius o empreses.
- **Monitorització de Rendiment:** Accés a estadístiques agregades de grups per part de professors/administradors.

## 5. Fora de l'Abast (Out of Scope)
- Pagaments amb diners reals (totes les transaccions són amb moneda virtual del joc).
- Creació d'un motor de jocs 3D complex (els jocs són 2D o 2.5D basats en web/canvas).
