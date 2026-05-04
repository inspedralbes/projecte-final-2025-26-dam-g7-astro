## Context

ASTRO uses `vue-i18n` for internationalization. Currently, it supports Spanish (es) and Catalan (ca). The language selection is only available in the `LeftSidebar.vue` via a `v-btn-toggle`, which is hidden on the landing page. English support is missing.

## Goals / Non-Goals

**Goals:**
- Add English (en) support.
- Create a unified, reusable `LanguageSelector.vue` component.
- Ensure language selection is available on the landing page.
- Maintain UI consistency with the "Space/Cyberpunk" aesthetic.

**Non-Goals:**
- Implementing server-side translation or dynamic loading of locales (keep it bundled for now).
- Translating game content that is dynamically generated (focus on UI/Static text).

## Decisions

### 1. New Reusable Component: `LanguageSelector.vue`
Instead of duplicating the toggle logic, we will create a dedicated component.
- **Rationale**: DRY principle and consistent UX.
- **UI Choice**: Use `v-menu` with a "glassmorphism" button. This allows for a more compact and elegant design than a standard select box or a large toggle group.
- **Alternatives**: 
    - `v-select`: Too "standard" and hard to style for the specific ASTRO look.
    - Floating flags: Can look cluttered and sometimes flags don't represent languages accurately.

### 2. Localization Storage
Continue using `localStorage.getItem('astro_language')`.
- **Rationale**: It's already implemented in `i18n/index.js` and `LeftSidebar.vue`.
- **Alternatives**: Cookie-based storage (useful for SSR, but not needed here).

### 3. "Glassmorphism" Styling
Use `backdrop-filter: blur(10px)` and semi-transparent backgrounds for the menu and buttons.
- **Rationale**: Matches the existing `LeftSidebar` and `RightSidebar` design language.

## Risks / Trade-offs

- **[Risk] Missing Translations** → **Mitigation**: Use `vue-i18n` fallback mechanism to Spanish (es) so the UI doesn't show raw keys.
- **[Trade-off] Bundle Size** → Bundling all three languages slightly increases the initial JS size, but since they are small JSON files (~25KB each), the impact is negligible compared to assets/images.
