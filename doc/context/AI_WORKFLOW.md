# AI_WORKFLOW: Flux de Treball amb Agents Intel·ligents

Astro ha estat desenvolupat utilitzant una metodologia "AI-Native", on l'agent d'IA actua com un col·laborador tècnic que segueix protocols estrictes per garantir la integritat del sistema.

## 1. El Protocol OpenSpec
El pilar fonamental del desenvolupament és el sistema **OpenSpec**, situat a la carpeta `doc/openspec`.

### 1.1. Definició (Explore & Propose)
- Abans de qualsevol canvi, s'utilitza la skill `openspec-explore` per analitzar l'impacte.
- Es genera una proposta formal amb `openspec-propose` que inclou:
    - Disseny visual i de components.
    - Requisits funcionals (Requirements).
    - Escenaris d'ús (Scenarios).
    - Tasques tècniques (Tasks).

### 1.2. Implementació (Apply)
- L'agent executa les tasques una per una utilitzant `openspec-apply-change`.
- Cada tasca s'ha de validar abans de passar a la següent per evitar regressions.

## 2. Modes d'IA i Responsabilitats
- **IA Arquitecte:** Defineix l'estructura dels fitxers Markdown i la lògica de dades inicial.
- **Agent d'Execució (Antigravity):** Implementa el codi seguint estrictament les especificacions. Té prohibit prendre decisions arquitectòniques sense aprovació humana.

## 3. Validació i TDD
- Per a funcionalitats de backend, l'agent té l'obligació de seguir un cicle **TDD (Test-Driven Development)**:
    1. Escriure el test (Unitari/Integració).
    2. Veure'l fallar.
    3. Implementar el codi.
    4. Passar el test.

## 4. Manteniment de Context
L'agent utilitza la carpeta `doc/context` per mantenir una visió global del projecte. Aquests fitxers són el "cervell" compartit que evita que la IA perdi el focus sobre els objectius a llarg termini del projecte.

## 5. Regles d'Or per a l'IA
- "No assumeixis, pregunta."
- "Si un canvi afecta a la DB, actualitza el model primer."
- "Preserva sempre els comentaris i la internacionalització."
