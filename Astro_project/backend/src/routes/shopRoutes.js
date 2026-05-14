// Astro_project/backend/src/routes/shopRoutes.js

function registerShopRoutes(app, { shopService, roomManager }) {
    // Endpoints de ruleta eliminados

    app.post('/api/shop/buy', async (req, res) => {
        const { user: username, item, quantity } = req.body;
        try {
            const result = await shopService.buyItem(username, item?.id, quantity);
            
            // Notificar por WebSocket para actualización en tiempo real
            if (roomManager) {
                roomManager.sendToUser(username, {
                    type: 'PROFILE_UPDATE',
                    coins: result.newBalance,
                    inventory: result.inventory,
                    streakFreezes: result.streakFreezes,
                    dailyPurchaseHistory: result.dailyPurchaseHistory
                });
            }

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
