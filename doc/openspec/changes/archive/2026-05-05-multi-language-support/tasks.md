## 1. i18n Core and TDD Setup

- [x] 1.1 Create `Astro_project/frontend/web/src/i18n/locales/en.json` with initial translations.
- [x] 1.2 Update `Astro_project/frontend/web/src/i18n/index.js` to register the `en` locale.
- [x] 1.3 Create `Astro_project/frontend/web/src/tests/i18n.test.js` to verify locale switching and persistence.
- [x] 1.4 Run tests and confirm they pass (or fail if implementation is missing).

## 2. Reusable UI Components

- [x] 2.1 Implement `Astro_project/frontend/web/src/components/layout/LanguageSelector.vue` with glassmorphism styling.
- [x] 2.2 Integrate `LanguageSelector` in `Astro_project/frontend/web/src/pages/home/index.vue` (Landing Navbar).
- [x] 2.3 Refactor `Astro_project/frontend/web/src/components/layout/LeftSidebar.vue` to use the new `LanguageSelector`.

## 3. Comprehensive Component Refactoring

- [x] 3.1 Audit and replace hardcoded strings in `Astro_project/frontend/web/src/components/layout/RightSidebar.vue`.
- [x] 3.2 Audit and replace hardcoded strings in `Astro_project/frontend/web/src/components/layout/ChatDrawer.vue`.
- [x] 3.3 Audit and replace hardcoded strings in `Astro_project/frontend/web/src/pages/profile/` and `Astro_project/frontend/web/src/pages/plans/`.
- [x] 3.4 Update `es.json` and `ca.json` with any new keys discovered during the audit.

## 4. Verification and Final TDD

- [x] 4.1 Run the full test suite (`npm run test` or equivalent) to ensure no regressions.
- [x] 4.2 Verify persistence by switching languages and reloading the application.
- [x] 4.3 Perform a final manual check of all user-facing pages in all three languages.
