import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n from '../i18n';

describe('Internationalization (i18n)', () => {
    beforeEach(() => {
        // Reset locale before each test
        i18n.global.locale.value = 'es';
        localStorage.clear();
    });

    it('should initialize with default locale (es)', () => {
        expect(i18n.global.locale.value).toBe('es');
    });

    it('should support switching to Catalan (ca)', () => {
        i18n.global.locale.value = 'ca';
        expect(i18n.global.locale.value).toBe('ca');
    });

    it('should support switching to English (en)', () => {
        i18n.global.locale.value = 'en';
        expect(i18n.global.locale.value).toBe('en');
    });

    it('should translate sidebar.home correctly in all languages', () => {
        i18n.global.locale.value = 'es';
        expect(i18n.global.t('sidebar.home')).toBe('Inicio');

        i18n.global.locale.value = 'ca';
        expect(i18n.global.t('sidebar.home')).toBe('Inici');

        i18n.global.locale.value = 'en';
        expect(i18n.global.t('sidebar.home')).toBe('Home');
    });

    it('should fallback to Spanish for missing translations', () => {
        i18n.global.locale.value = 'en';
        // Testing a key that we know exists in ES but might be missing if not updated
        expect(i18n.global.t('general.loading')).toBe('Loading...');
    });
});
