
function registerGroupRoutes(app, { groupService, statsService }) {
    
    // Crear Profesor (solo Centros)
    app.post('/api/group/teacher', async (req, res) => {
        const { centerUsername, username, password } = req.body;
        try {
            await groupService.createTeacher(centerUsername, { username, password });
            res.json({ success: true, message: 'Profesor creado correctamente' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    // Crear Alumno (solo Profesores)
    app.post('/api/group/student', async (req, res) => {
        const { teacherUsername, username, password } = req.body;
        try {
            await groupService.createStudent(teacherUsername, { username, password });
            res.json({ success: true, message: 'Alumno creado correctamente' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    // Obtener miembros (alumnos de un profe o profes de un centro)
    app.get('/api/group/members/:username', async (req, res) => {
        try {
            const members = await groupService.getMembers(req.params.username);
            res.json(members);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Stats de clase
    app.get('/api/group/stats/class/:teacherUsername', async (req, res) => {
        try {
            const stats = await statsService.getClassStats(req.params.teacherUsername);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Stats globales de centro
    app.get('/api/group/stats/center/:centerUsername', async (req, res) => {
        try {
            const stats = await statsService.getCenterStats(req.params.centerUsername);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
}

module.exports = { registerGroupRoutes };
