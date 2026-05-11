
const roomManager = require('../ws/RoomManager');

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

    // Crear miembro genérico según rol (CENTER->TEACHER/STUDENT, TEACHER->STUDENT)
    app.post('/api/group/member', async (req, res) => {
        const { managerUsername, username, password, role } = req.body;
        try {
            await groupService.createMember(managerUsername, { username, password }, role);
            res.json({ success: true, message: 'Miembro creado correctamente' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    // Invitar usuario ya existente al grupo
    app.post('/api/group/invite', async (req, res) => {
        const { managerUsername, invitedUsername, role } = req.body;
        try {
            const invitation = await groupService.inviteExistingUser(managerUsername, invitedUsername, role);
            const invitee = await groupService.userRepo.findByUsername(invitedUsername);
            roomManager.sendToUser(invitedUsername, {
                type: 'GROUP_INVITATION_UPDATE',
                groupInvitations: invitee?.groupInvitations || []
            });
            res.json({ success: true, invitation });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    app.post('/api/group/invite/accept', async (req, res) => {
        const { user, invitationId } = req.body;
        try {
            const profile = await groupService.acceptGroupInvitation(user, invitationId);
            const invitee = await groupService.userRepo.findByUsername(user);
            roomManager.sendToUser(user, {
                type: 'GROUP_MEMBERSHIP_UPDATE',
                profile,
                groupInvitations: invitee?.groupInvitations || []
            });
            res.json({ success: true, profile });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    app.post('/api/group/invite/reject', async (req, res) => {
        const { user, invitationId } = req.body;
        try {
            await groupService.rejectGroupInvitation(user, invitationId);
            const invitee = await groupService.userRepo.findByUsername(user);
            roomManager.sendToUser(user, {
                type: 'GROUP_INVITATION_UPDATE',
                groupInvitations: invitee?.groupInvitations || []
            });
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    app.post('/api/group/leave/request', async (req, res) => {
        const { user } = req.body;
        try {
            const request = await groupService.requestLeaveToIndividual(user);
            const requester = await groupService.userRepo.findByUsername(user);
            const approver = requester?.parentId
                ? await groupService.userRepo.findByUsername(requester.parentId)
                : null;

            if (approver) {
                roomManager.sendToUser(approver.username, {
                    type: 'GROUP_APPROVAL_UPDATE',
                    groupApprovalRequests: approver.groupApprovalRequests || []
                });
            }

            res.json({ success: true, request });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    app.get('/api/group/approvals/:username', async (req, res) => {
        try {
            const requests = await groupService.getApprovalRequests(req.params.username);
            res.json({ success: true, requests });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    app.post('/api/group/leave/approve', async (req, res) => {
        const { approverUsername, requestId } = req.body;
        try {
            const profile = await groupService.approveLeaveToIndividual(approverUsername, requestId);
            const approver = await groupService.userRepo.findByUsername(approverUsername);
            roomManager.sendToUser(approverUsername, {
                type: 'GROUP_APPROVAL_UPDATE',
                groupApprovalRequests: approver?.groupApprovalRequests || []
            });
            roomManager.sendToUser(profile.requester, {
                type: 'GROUP_MEMBERSHIP_UPDATE',
                profile
            });
            res.json({ success: true, profile });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    app.post('/api/group/leave/reject', async (req, res) => {
        const { approverUsername, requestId } = req.body;
        try {
            await groupService.rejectLeaveToIndividual(approverUsername, requestId);
            const approver = await groupService.userRepo.findByUsername(approverUsername);
            roomManager.sendToUser(approverUsername, {
                type: 'GROUP_APPROVAL_UPDATE',
                groupApprovalRequests: approver?.groupApprovalRequests || []
            });
            res.json({ success: true });
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
