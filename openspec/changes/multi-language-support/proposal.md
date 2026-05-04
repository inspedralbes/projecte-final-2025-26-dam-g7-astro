## Why

Enable ASTRO to reach a wider audience and provide a more accessible experience by supporting multiple languages (English, Spanish, and Catalan). Currently, the platform has partial support for Spanish and Catalan, but it is not fully integrated across all pages (like the landing page) and lacks English support.

## What Changes

- **Add English support**: Create `en.json` with translations for all existing keys.
- **Unified Language Selector**: Create a reusable `LanguageSelector.vue` component with a modern "glassmorphism" design that fits the ASTRO aesthetic.
- **Landing Page Integration**: Add the language selector to the landing page (`index.vue`) navbar.
- **Sidebar Integration**: Replace the current language toggle in `LeftSidebar.vue` with the new unified selector.
- **Full Internationalization**: Audit and ensure all user-facing text in the web frontend uses `$t()` for translations.

## Capabilities

### New Capabilities
- `multi-language-support`: Provides a centralized way to switch between English, Spanish, and Catalan across the entire application, including landing and internal pages.

### Modified Capabilities
- None.

## Impact

- **Frontend (Web)**:
    - `Astro_project/frontend/web/src/i18n/`: Adding `en.json` and updating `index.js` to include the new locale.
    - `Astro_project/frontend/web/src/components/layout/`: New `LanguageSelector.vue` and modifications to `LeftSidebar.vue`.
    - `Astro_project/frontend/web/src/pages/home/index.vue`: Adding the selector to the landing page.
- **User Experience**: Users will be able to switch languages from any entry point of the application.
