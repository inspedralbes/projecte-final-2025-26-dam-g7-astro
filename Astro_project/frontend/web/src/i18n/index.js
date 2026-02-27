import { createI18n } from 'vue-i18n';
import es from './locales/es.json';
import ca from './locales/ca.json';

const i18n = createI18n({
    legacy: false, // Set to false to use Composition API
    locale: localStorage.getItem('astro_language') || 'es', // Default locale
    fallbackLocale: 'es',
    messages: {
        es,
        ca
    }
});

export default i18n;
