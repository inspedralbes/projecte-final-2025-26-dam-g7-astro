# Proposal: Frontend Translation Audit

## What are we building?
A comprehensive audit and implementation to ensure **100% of the frontend text** is translatable via `vue-i18n`. This includes finding and replacing hardcoded strings in pages, sidebars, generic components, and dynamic data coming from the backend.

## Why are we building it?
The user noticed that some texts (like parts of the Right Sidebar) are not translated. An incomplete translation breaks immersion and user experience. By doing a full audit, we ensure that Catalan, Spanish, and English users have a flawless native experience.

## Success Criteria
- No hardcoded Spanish or Catalan text remains in `.vue` files.
- `AppFooter.vue` and `LanguageSelector.vue` correctly react to language changes.
- Fallback translations are robust.
- Dynamic texts (like Missions) are properly translated or mapped to keys.
