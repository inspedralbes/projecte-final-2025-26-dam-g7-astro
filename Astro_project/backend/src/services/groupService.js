class GroupService {
    constructor({ userRepository }) {
        this.userRepo = userRepository;
    }

    _createRequestId() {
        return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }

    _isGroupManager(user) {
        if (!user || user.plan !== 'GRUPAL') return false;
        return user.role === 'CENTER' || user.role === 'TEACHER';
    }

    _assertTargetRoleAllowed(manager, targetRole) {
        if (manager.role === 'CENTER' && (targetRole === 'TEACHER' || targetRole === 'STUDENT')) {
            return;
        }
        if (manager.role === 'TEACHER' && targetRole === 'STUDENT') {
            return;
        }
        throw new Error("No tienes permisos para añadir este tipo de miembro");
    }

    _buildMemberDoc(parentUsername, memberData, role) {
        const isTeacher = role === 'TEACHER';
        return {
            user: memberData.username,
            pass: memberData.password,
            plan: 'GRUPAL',
            role,
            parentId: parentUsername,
            coins: isTeacher ? 0 : 100,
            xp: 0,
            level: 1,
            rank: isTeacher ? 'Instructor de Vuelo' : 'Recluta Espacial',
            avatar: isTeacher ? 'Astronauta_taronja.jpg' : 'Astronauta_blanc.jpg',
            groupInvitations: [],
            groupApprovalRequests: [],
            scheduledPlanDowngrade: null
        };
    }

    async createMember(managerUsername, memberData, role) {
        if (!memberData?.username || !memberData?.password) {
            throw new Error("Nombre de usuario y contraseña requeridos para crear un miembro nuevo");
        }

        const manager = await this.userRepo.findByUsername(managerUsername);
        if (!this._isGroupManager(manager)) {
            throw new Error("El usuario no tiene permisos de gestión educativa.");
        }

        this._assertTargetRoleAllowed(manager, role);

        const existing = await this.userRepo.findByUsername(memberData.username);
        if (existing) {
            throw new Error(`El nombre de usuario del ${role === 'TEACHER' ? 'profesor' : 'alumno'} ya existe.`);
        }

        const newUserDoc = this._buildMemberDoc(manager.username, memberData, role);
        return await this.userRepo.saveDoc(newUserDoc);
    }

    async createTeacher(centerUsername, teacherData) {
        const center = await this.userRepo.findByUsername(centerUsername);
        if (!center || center.role !== 'CENTER' || center.plan !== 'GRUPAL') {
            throw new Error("El usuario no es un centro autorizado.");
        }

        return this.createMember(centerUsername, teacherData, 'TEACHER');
    }

    async createStudent(managerUsername, studentData) {
        const manager = await this.userRepo.findByUsername(managerUsername);
        if (!manager || !this._isGroupManager(manager)) {
            throw new Error("El usuario no es un profesor o centro autorizado.");
        }

        return this.createMember(managerUsername, studentData, 'STUDENT');
    }

    async inviteExistingUser(managerUsername, invitedUsername, role) {
        if (managerUsername === invitedUsername) {
            throw new Error("No puedes invitarte a ti mismo");
        }

        const manager = await this.userRepo.findByUsername(managerUsername);
        if (!this._isGroupManager(manager)) {
            throw new Error("No tienes permisos para invitar usuarios al grupo");
        }
        this._assertTargetRoleAllowed(manager, role);

        const invited = await this.userRepo.findByUsername(invitedUsername);
        if (!invited) {
            throw new Error("Ese explorador no existe");
        }

        const isGroupOwner = invited.plan === 'GRUPAL' && !invited.parentId && (invited.role === 'CENTER' || invited.role === 'TEACHER');
        if (isGroupOwner) {
            throw new Error("No puedes invitar a un responsable de otro grupo");
        }

        invited.groupInvitations = Array.isArray(invited.groupInvitations) ? invited.groupInvitations : [];
        const duplicated = invited.groupInvitations.some((inv) => inv.parentId === manager.username && inv.targetRole === role);
        if (duplicated) {
            throw new Error("Ya existe una invitación pendiente para este usuario");
        }

        const invitation = {
            id: this._createRequestId(),
            type: 'GROUP_INVITE',
            from: manager.username,
            parentId: manager.username,
            managerRole: manager.role,
            targetRole: role,
            createdAt: new Date().toISOString()
        };

        invited.groupInvitations.push(invitation);
        await this.userRepo.update(invited);
        return invitation;
    }

    async acceptGroupInvitation(username, invitationId) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        user.groupInvitations = Array.isArray(user.groupInvitations) ? user.groupInvitations : [];
        const invitation = user.groupInvitations.find((inv) => inv.id === invitationId);
        if (!invitation) {
            throw new Error("Invitación no encontrada");
        }

        const manager = await this.userRepo.findByUsername(invitation.parentId);
        if (!this._isGroupManager(manager)) {
            throw new Error("El responsable del grupo ya no está disponible");
        }
        this._assertTargetRoleAllowed(manager, invitation.targetRole);

        const isGroupOwner = user.plan === 'GRUPAL' && !user.parentId && (user.role === 'CENTER' || user.role === 'TEACHER');
        if (isGroupOwner) {
            throw new Error("No puedes aceptar una invitación mientras seas responsable de un grupo");
        }

        user.plan = 'GRUPAL';
        user.role = invitation.targetRole;
        user.parentId = invitation.parentId;
        user.scheduledPlanDowngrade = null;
        user.groupInvitations = user.groupInvitations.filter((inv) => inv.id !== invitationId);

        await this.userRepo.update(user);
        return {
            plan: user.plan,
            role: user.role,
            parentId: user.parentId
        };
    }

    async rejectGroupInvitation(username, invitationId) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        user.groupInvitations = Array.isArray(user.groupInvitations) ? user.groupInvitations : [];
        const before = user.groupInvitations.length;
        user.groupInvitations = user.groupInvitations.filter((inv) => inv.id !== invitationId);
        if (before === user.groupInvitations.length) {
            throw new Error("Invitación no encontrada");
        }

        await this.userRepo.update(user);
        return true;
    }

    async _resolveApproverForLeaveRequest(user) {
        if (!user.parentId) {
            throw new Error("Este usuario no depende de ningún responsable");
        }

        const approver = await this.userRepo.findByUsername(user.parentId);
        if (!approver || !this._isGroupManager(approver)) {
            throw new Error("No se ha encontrado un responsable válido");
        }

        if (user.role === 'TEACHER' && approver.role !== 'CENTER') {
            throw new Error("Un profesor solo puede solicitar baja a su centro");
        }

        return approver;
    }

    async requestLeaveToIndividual(username) {
        const requester = await this.userRepo.findByUsername(username);
        if (!requester) {
            throw new Error("Usuario no encontrado");
        }

        if (requester.plan !== 'GRUPAL' || !requester.parentId || !['STUDENT', 'TEACHER'].includes(requester.role)) {
            throw new Error("Solo miembros dependientes pueden solicitar esta baja");
        }

        const approver = await this._resolveApproverForLeaveRequest(requester);
        approver.groupApprovalRequests = Array.isArray(approver.groupApprovalRequests) ? approver.groupApprovalRequests : [];

        const duplicated = approver.groupApprovalRequests.some((req) => req.type === 'LEAVE_TO_INDIVIDUAL' && req.requester === requester.username);
        if (duplicated) {
            throw new Error("Ya existe una solicitud pendiente para este usuario");
        }

        const request = {
            id: this._createRequestId(),
            type: 'LEAVE_TO_INDIVIDUAL',
            requester: requester.username,
            requesterRole: requester.role,
            createdAt: new Date().toISOString()
        };

        approver.groupApprovalRequests.push(request);
        await this.userRepo.update(approver);
        return request;
    }

    async getApprovalRequests(username) {
        const approver = await this.userRepo.findByUsername(username);
        if (!approver || !this._isGroupManager(approver)) {
            throw new Error("Usuario no autorizado");
        }

        return Array.isArray(approver.groupApprovalRequests) ? approver.groupApprovalRequests : [];
    }

    async approveLeaveToIndividual(approverUsername, requestId) {
        const approver = await this.userRepo.findByUsername(approverUsername);
        if (!approver || !this._isGroupManager(approver)) {
            throw new Error("Usuario no autorizado");
        }

        approver.groupApprovalRequests = Array.isArray(approver.groupApprovalRequests) ? approver.groupApprovalRequests : [];
        const request = approver.groupApprovalRequests.find((req) => req.id === requestId);
        if (!request) {
            throw new Error("Solicitud no encontrada");
        }

        const requester = await this.userRepo.findByUsername(request.requester);
        if (!requester) {
            approver.groupApprovalRequests = approver.groupApprovalRequests.filter((req) => req.id !== requestId);
            await this.userRepo.update(approver);
            throw new Error("El usuario solicitante ya no existe");
        }

        if (requester.parentId !== approver.username) {
            throw new Error("No tienes permisos para aprobar esta solicitud");
        }

        if (requester.role === 'TEACHER') {
            if (approver.role !== 'CENTER') {
                throw new Error("Solo un centro puede aprobar la salida de un profesor");
            }

            const students = await this.userRepo.collection.find({ parentId: requester.username, role: 'STUDENT' }).toArray();
            await Promise.all(students.map(async (studentDoc) => {
                const student = await this.userRepo.findByUsername(studentDoc.user);
                if (!student) return;
                student.parentId = approver.username;
                await this.userRepo.update(student);
            }));
        }

        requester.plan = 'INDIVIDUAL_FREE';
        requester.role = null;
        requester.parentId = null;
        requester.scheduledPlanDowngrade = null;

        approver.groupApprovalRequests = approver.groupApprovalRequests.filter((req) => req.id !== requestId);

        await Promise.all([
            this.userRepo.update(requester),
            this.userRepo.update(approver)
        ]);

        return {
            requester: requester.username,
            plan: requester.plan,
            role: requester.role,
            parentId: requester.parentId
        };
    }

    async rejectLeaveToIndividual(approverUsername, requestId) {
        const approver = await this.userRepo.findByUsername(approverUsername);
        if (!approver || !this._isGroupManager(approver)) {
            throw new Error("Usuario no autorizado");
        }

        approver.groupApprovalRequests = Array.isArray(approver.groupApprovalRequests) ? approver.groupApprovalRequests : [];
        const before = approver.groupApprovalRequests.length;
        approver.groupApprovalRequests = approver.groupApprovalRequests.filter((req) => req.id !== requestId);
        if (before === approver.groupApprovalRequests.length) {
            throw new Error("Solicitud no encontrada");
        }

        await this.userRepo.update(approver);
        return true;
    }

    async getMembers(parentUsername) {
        const members = await this.userRepo.collection.find({ parentId: parentUsername }).toArray();
        return members.map((m) => ({
            username: m.user,
            role: m.role,
            level: m.level,
            rank: m.rank,
            avatar: m.avatar
        }));
    }

    async getCenterGlobalStats(centerUsername) {
        return await this.getMembers(centerUsername);
    }
}

module.exports = GroupService;
