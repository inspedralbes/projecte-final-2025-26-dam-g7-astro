// Astro_project/backend/src/routes/shopRoutes.js

function registerShopRoutes(app, { shopService }) {
    // Endpoints de ruleta eliminados

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
