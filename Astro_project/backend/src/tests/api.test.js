const request = require('supertest');
const express = require('express');

describe('API Endpoints - Simulación', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Simulamos una ruta sencilla de la API para verificar el flujo
        app.get('/api/status', (req, res) => {
            res.json({ status: 'ok', project: 'Astro' });
        });

        app.post('/api/echo', (req, res) => {
            res.json(req.body);
        });
    });

    test('GET /api/status debe retornar 200 y el estado ok', async () => {
        const response = await request(app).get('/api/status');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('ok');
    });

    test('POST /api/echo debe retornar el mismo cuerpo enviado (usado por stores)', async () => {
        const payload = { user: 'astronauta', action: 'login' };
        const response = await request(app)
            .post('/api/echo')
            .send(payload);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(payload);
    });

    test('Llamada inexistente debe retornar 404', async () => {
        const response = await request(app).get('/api/notfound');
        expect(response.statusCode).toBe(404);
    });
});
