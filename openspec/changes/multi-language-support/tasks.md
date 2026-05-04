## 1. i18n Configuration

- [ ] 1.1 Create `Astro_project/frontend/web/src/i18n/locales/en.json` with initial English translations.
- [ ] 1.2 Update `Astro_project/frontend/web/src/i18n/index.js` to import and register the `en` locale.

## 2. Shared Components

- [ ] 2.1 Implement `Astro_project/frontend/web/src/components/layout/LanguageSelector.vue` using `v-menu` and glassmorphism styling.
- [ ] 2.2 Ensure the component updates the `vue-i18n` locale and `localStorage` correctly.

## 3. Page Integration

- [ ] 3.1 Modify `Astro_project/frontend/web/src/pages/home/index.vue` to import and display `LanguageSelector` in the top `v-app-bar`.
- [ ] 3.2 Refactor `Astro_project/frontend/web/src/components/layout/LeftSidebar.vue` to remove the old `v-btn-toggle` and use the new `LanguageSelector` instead.

## 4. Verification and Cleanup

- [ ] 4.1 Audit and wrap any remaining static text in `index.vue` and `LeftSidebar.vue` with `$t()`.
- [ ] 4.2 Verify that switching language on the landing page reflects correctly inside the app (and vice-versa).
- [ ] 4.3 Test persistence by changing language and reloading the browser.
