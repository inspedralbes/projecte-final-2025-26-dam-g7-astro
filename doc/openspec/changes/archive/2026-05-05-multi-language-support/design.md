## Context

The project recently merged a large set of changes that introduced new architectural patterns (Repository Pattern) and UI components (`RightSidebar.vue`, `ChatDrawer.vue`). These components have hardcoded Spanish text. Additionally, `RULES.md` now mandates a "Plan Mode" and TDD approach for all implementations.

## Goals / Non-Goals

**Goals:**
- Implement a unified internationalization strategy for English, Spanish, and Catalan.
- Remove all hardcoded UI strings in the web frontend.
- Provide a reusable `LanguageSelector.vue` component.
- Follow the TDD workflow by writing tests before implementation.
- Adhere to the "Plan Mode" by documenting implementation steps in `tasks.md`.

**Non-Goals:**
- Implementing backend-side translations (e.g., error messages from the API).
- Dynamic locale loading (locales will remain bundled).

## Decisions

### 1. Unified Language Selector Component
- **Component**: `LanguageSelector.vue`
- **Design**: Glassmorphism (blur, semi-transparency) using Vuetify's `v-menu`.
- **Rationale**: Better UX for supporting 3+ languages than a simple toggle.
- **Location**: Reused in `index.vue` (landing) and `LeftSidebar.vue`.

### 2. TDD Implementation Strategy
- **Framework**: Vitest (matching existing tests in `src/tests`).
- **Test Case**: A new `i18n.test.js` will simulate locale switching and verify that the `vue-i18n` state and `localStorage` are updated.
- **Execution**: Run tests before and after the refactor of components.

### 3. Comprehensive UI Audit
- We will perform a systematic search for string literals in `.vue` files within `src/components/layout` and `src/pages` to ensure 100% coverage.

## Risks / Trade-offs

- **[Risk] Missing keys in one language** → **Mitigation**: Vue-i18n is configured to fallback to Spanish (`es`).
- **[Risk] Breaking layout with longer translations** → **Mitigation**: Use Vuetify's flexible grid and text truncation where necessary, specifically in narrow sidebars.
- **[Trade-off] Bundle size** → Bundling English adds ~25KB, which is negligible given the asset-heavy nature of the app.
