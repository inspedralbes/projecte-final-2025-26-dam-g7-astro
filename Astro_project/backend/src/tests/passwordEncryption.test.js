// Astro_project/backend/src/tests/passwordEncryption.test.js

const User = require('../domain/User');
const InMemoryUserRepository = require('../repositories/InMemoryUserRepository');
const AuthService = require('../services/authService');
const UserService = require('../services/userService');
const bcrypt = require('bcryptjs');

describe('Password Encryption Flow', () => {
    let userRepo;
    let authService;
    let userService;

    beforeEach(() => {
        userRepo = new InMemoryUserRepository();
        authService = new AuthService({
            userRepository: userRepo,
            updateStreak: jest.fn().mockResolvedValue({ streak: 1, previousStreak: 0, freezeUnits: 0, needsFreeze: false }),
            normalizeAndPersistInventory: jest.fn().mockResolvedValue([]),
            getInventoryQuantity: jest.fn().mockReturnValue(0),
            normalizeActiveBoosters: jest.fn().mockReturnValue({})
        });
        userService = new UserService({
            userRepository: userRepo
        });
    });

    test('Debe encriptar la contraseña al registrar un nuevo usuario', async () => {
        const username = 'cryptouser';
        const password = 'SecurePassword@123';
        
        await authService.register(username, password, 'Cadete de Vuelo');

        const savedUser = userRepo.users.get(username);
        expect(savedUser).toBeDefined();
        expect(savedUser.pass).not.toBe(password);
        expect(savedUser.pass.startsWith('$2')).toBe(true);

        const isMatch = await bcrypt.compare(password, savedUser.pass);
        expect(isMatch).toBe(true);
    });

    test('Debe iniciar sesión correctamente con contraseña encriptada', async () => {
        const username = 'cryptouser';
        const password = 'SecurePassword@123';
        
        await authService.register(username, password, 'Cadete de Vuelo');

        const loginResult = await authService.login(username, password);
        expect(loginResult.user.username).toBe(username);
    });

    test('Debe fallar el inicio de sesión con contraseña incorrecta', async () => {
        const username = 'cryptouser';
        const password = 'SecurePassword@123';
        
        await authService.register(username, password, 'Cadete de Vuelo');

        await expect(authService.login(username, 'wrongpassword')).rejects.toThrow('Credenciales no reconocidas');
    });

    test('Debe mantener la compatibilidad con contraseñas en texto plano antiguas', async () => {
        const username = 'legacyuser';
        const password = 'plainpassword';

        // Guardamos directamente en texto plano
        userRepo.users.set(username, {
            user: username,
            pass: password,
            plan: 'INDIVIDUAL_FREE',
            role: null,
            rank: 'Cadete de Vuelo'
        });

        const loginResult = await authService.login(username, password);
        expect(loginResult.user.username).toBe(username);
        expect(loginResult.user.isPasswordWeak).toBe(true);
    });

    test('Debe encriptar la contraseña al actualizarla en el repositorio', async () => {
        const username = 'userchange';
        const oldPass = 'OldPassword@123';
        const newPass = 'NewSecurePassword@123';

        await authService.register(username, oldPass, 'Cadete de Vuelo');

        const updated = await userRepo.updatePassword(username, newPass);
        expect(updated).toBe(true);

        const savedUser = userRepo.users.get(username);
        expect(savedUser.pass).not.toBe(newPass);
        expect(savedUser.pass.startsWith('$2')).toBe(true);

        const isMatch = await bcrypt.compare(newPass, savedUser.pass);
        expect(isMatch).toBe(true);
    });

    test('Debe lanzar error si la contraseña de registro es débil', async () => {
        const username = 'weakregister';
        const weakPasswords = [
            'weak', // too short
            'onlylowercase', // no uppercase, number, symbol
            'ONLYUPPERCASE', // no lowercase, number, symbol
            'NoNumOrSymbol', // no number or symbol
            'NoSymbol123', // no symbol
            'NoNumber@', // no number
        ];

        for (const weakPass of weakPasswords) {
            await expect(authService.register(username, weakPass, 'Cadete de Vuelo'))
                .rejects.toThrow('La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial.');
        }
    });

    test('Debe lanzar error si la nueva contraseña al cambiarla es débil', async () => {
        const username = 'passchangevalidation';
        const strongPass = 'SecurePassword@123';
        const weakPass = 'weak123';

        await authService.register(username, strongPass, 'Cadete de Vuelo');

        await expect(userService.changePassword(username, strongPass, weakPass))
            .rejects.toThrow('La nueva contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial.');
    });
});
