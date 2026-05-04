const { normalizeAchievementIds } = require('../utils/achievements');

describe('Achievements Utils - normalizeAchievementIds', () => {
    test('debe retornar un array vacío si no se pasan IDs', () => {
        expect(normalizeAchievementIds()).toEqual([]);
    });

    test('debe filtrar IDs no válidos y duplicados', () => {
        const input = [1, 5, 5, '10', -1, 'hola', 3.5];
        // 1, 5, 5->5, 10, -1->filt, hola->filt, 3.5->filt si no es entero
        // El código usa Number(id) y Number.isInteger(id) && id > 0
        // '10' -> 10 (válido), 3.5 -> filt
        expect(normalizeAchievementIds(input)).toEqual([1, 5, 10]);
    });

    test('debe ordenar los IDs de forma ascendente', () => {
        const input = [20, 5, 1];
        expect(normalizeAchievementIds(input)).toEqual([1, 5, 20]);
    });
});
