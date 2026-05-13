import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import en from './locales/en.json';
import es from './locales/es.json';
import ca from './locales/ca.json';

const translations = {
  en,
  es,
  ca,
};

const i18n = new I18n(translations);

// Set the locale once at the beginning of your app.
i18n.locale = getLocales()[0].languageCode ?? 'en';

// When a value is missing from a language it'll fallback to another language with the key present.
i18n.enableFallback = true;

export default i18n;
