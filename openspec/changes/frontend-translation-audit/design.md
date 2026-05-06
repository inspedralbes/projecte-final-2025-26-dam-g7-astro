# Design: Frontend Translation System

## Architecture
The frontend already uses `vue-i18n` injected globally via `Pinia` and `App.vue`. The primary locales are loaded from `src/i18n/locales/`.

## Challenges
1. **Dynamic Backend Data**: Text like "Misión especial" comes from the server in `RightSidebar.vue`. We will need to map these strings to translation keys `t('missions.special')`.
2. **Generic Components**: `AppFooter` is standard Vuetify boilerplate. We will rewrite it to be localized and relevant to ASTRO.
3. **Pages Directory**: All `.vue` files in `src/pages/` will be systematically searched for regular expressions matching un-translated text.

## Solution Approach
- Use `{{ $t('key') }}` in templates.
- Use `const { t } = useI18n()` in `<script setup>` for computed properties or variables.
- Consolidate keys hierarchically in `es.json`, `ca.json`, `en.json` (e.g., `"pages": { "home": { "welcome": "..." } }`).
