const { JERARQUIA } = require('../constants/progression');

describe('Progression Constants', () => {
    test('JERARQUIA debe ser un array de strings', () => {
        expect(Array.isArray(JERARQUIA)).toBe(true);
        expect(JERARQUIA.length).toBeGreaterThan(0);
        JERARQUIA.forEach(rango => {
            expect(typeof rango).toBe('string');
        });
    });

    test('debe contener los rangos esperados en orden', () => {
        expect(JERARQUIA[0]).toBe('Cadete de Vuelo');
        expect(JERARQUIA[JERARQUIA.length - 1]).toBe('Almirante del Universo');
    });
});
