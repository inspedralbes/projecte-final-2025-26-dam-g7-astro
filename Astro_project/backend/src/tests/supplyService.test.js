const SupplyService = require('../services/supplyService');

describe('SupplyService', () => {
    let supplyService;
    let mockCollection;

    beforeEach(() => {
        mockCollection = {
            insertOne: jest.fn(),
            find: jest.fn().mockReturnThis(),
            toArray: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn(),
            updateOne: jest.fn()
        };

        supplyService = new SupplyService({ getCollection: () => mockCollection });
    });

    test('createSupplySet debe insertar un nuevo set de suministros', async () => {
        mockCollection.insertOne.mockResolvedValue({ insertedId: 'set123' });

        const data = { name: 'Misión Marte', content: ['roca', 'polvo'] };
        const result = await supplyService.createSupplySet('owner1', data);

        expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
            ownerId: 'owner1',
            name: 'Misión Marte'
        }));
        expect(result.id).toBe('set123');
    });

    test('getSupplySetsByOwner debe filtrar por propietario', async () => {
        mockCollection.toArray.mockResolvedValue([{ name: 'S1' }, { name: 'S2' }]);

        const result = await supplyService.getSupplySetsByOwner('owner1');

        expect(mockCollection.find).toHaveBeenCalledWith({ ownerId: 'owner1' });
        expect(result).toHaveLength(2);
    });

    test('getActiveSupplySet debe buscar set activo para un dueño y juego', async () => {
        mockCollection.findOne.mockResolvedValue({ name: 'ActiveSet' });

        const result = await supplyService.getActiveSupplySet('owner1', 'gameA');

        expect(mockCollection.findOne).toHaveBeenCalledWith({
            ownerId: 'owner1',
            active: true,
            gameId: 'gameA'
        });
        expect(result.name).toBe('ActiveSet');
    });
});
