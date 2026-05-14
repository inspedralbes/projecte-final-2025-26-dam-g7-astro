const User = require('../domain/User');

describe('User Domain Model', () => {
    test('Debe crear un usuario con valores por defecto correctos', () => {
        const user = new User({ username: 'testuser' });
        expect(user.username).toBe('testuser');
        expect(user.profileColor).toBe('#0a192f'); // Default color
    });

    test('Debe permitir establecer un profileColor personalizado', () => {
        const user = new User({ username: 'testuser', profileColor: '#ff0000' });
        expect(user.profileColor).toBe('#ff0000');
    });

    test('Debe manejar AstroCoins correctamente en el objeto de datos', () => {
        // Asumiendo que User tiene una propiedad coins
        const user = new User({ username: 'testuser', coins: 15000 });
        expect(user.coins).toBe(15000);
    });
});
