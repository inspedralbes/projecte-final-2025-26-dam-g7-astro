// Astro_project/backend/src/routes/shopRoutes.js

function registerShopRoutes(app, { shopService }) {
    app.post('/api/shop/spin', async (req, res) => {
        const { user } = req.body;
        try {
            const result = await shopService.spinWheel(user);
            res.json(result);
        } catch (error) {
            console.error('Error en ruleta:', error);
            res.status(error.message === 'Saldo insuficiente' ? 402 : 500).json({ 
                success: false, 
                message: error.message || 'Error en la ruleta' 
            });
        }
    });

    app.post('/api/shop/buy-tickets', async (req, res) => {
        const { user } = req.body;
        try {
            const result = await shopService.buyTickets(user);
            res.json(result);
        } catch (error) {
            console.error('Error comprando tickets:', error);
            res.status(error.message.includes('insuficientes') ? 402 : 500).json({ 
                success: false, 
                message: error.message || 'Error procesando la compra de tickets.' 
            });
        }
    });

    app.post('/api/shop/buy', async (req, res) => {
        const { user, item } = req.body;
        try {
            const result = await shopService.buyItem(user, item?.id);
            res.json(result);
        } catch (error) {
            console.error('Error en compra:', error);
            res.status(error.message.includes('insuficientes') ? 400 : 500).json({ 
                success: false, 
                message: error.message || 'Error en la transacción estelar.' 
            });
        }
    });
}

module.exports = {
    registerShopRoutes
};
