## Why

Enable ASTRO to reach a global audience and provide a consistent user experience by supporting English, Spanish, and Catalan across all modules. This change also ensures the project adheres to the newly established `RULES.md`, specifically regarding TDD and Plan Mode, while addressing hardcoded strings in recently merged components.

## What Changes

- **Full Internationalization (i18n)**: Implement English (`en.json`) and audit existing Spanish (`es.json`) and Catalan (`ca.json`) locales to include all recently added UI elements.
- **New Reusable Component**: Create `LanguageSelector.vue` with a "glassmorphism" aesthetic suitable for both the landing page and the sidebar.
- **Component Refactoring**: Replace hardcoded Spanish strings in `RightSidebar.vue`, `ChatDrawer.vue`, and other components with `$t()` translation keys.
- **TDD Integration**: Add automated tests to verify the i18n switching logic and state persistence.
- **Landing Page Integration**: Add the language selector to the `index.vue` navbar.

## Capabilities

### New Capabilities
- `multi-language-support`: Centralized system to manage and switch between English, Spanish, and Catalan across the entire application, ensuring persistent selection and zero hardcoded UI strings.

### Modified Capabilities
- None.

## Impact

- **Frontend (Web)**:
    - `src/i18n/`: Adding `en.json` and updating config.
    - `src/components/layout/`: New `LanguageSelector.vue`, updates to `LeftSidebar.vue`, `RightSidebar.vue`, and `ChatDrawer.vue`.
    - `src/pages/`: Updates to `home/index.vue`, `profile/`, and `plans/`.
    - `src/tests/`: New `i18n.test.js` for TDD validation.
- **Architecture**: Adoption of the "Plan Mode" and TDD workflows for this specific feature implementation as per `RULES.md`.
