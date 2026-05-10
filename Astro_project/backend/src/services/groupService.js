
class GroupService {
    constructor({ userRepository }) {
        this.userRepo = userRepository;
    }

    async createTeacher(centerUsername, teacherData) {
        const center = await this.userRepo.findByUsername(centerUsername);
        if (!center || center.role !== 'CENTER') {
            throw new Error("El usuario no es un centro autorizado.");
        }

        const existing = await this.userRepo.findByUsername(teacherData.username);
        if (existing) throw new Error("El nombre de usuario del profesor ya existe.");

        const teacher = {
            username: teacherData.username,
            pass: teacherData.password, // Nota: En un sistema real, cifraríamos la pass
            plan: 'GRUPAL',
            role: 'TEACHER',
            parentId: center.username,
            coins: 0,
            xp: 0,
            level: 1
        };

        // Reutilizamos la lógica de guardado (podríamos refactorizar authService para esto)
        // Por ahora lo hacemos directo para prototipar rápido
        const newUserDoc = {
            user: teacher.username,
            pass: teacher.pass,
            plan: teacher.plan,
            role: teacher.role,
            parentId: teacher.parentId,
            coins: teacher.coins,
            xp: teacher.xp,
            level: teacher.level,
            rank: 'Instructor de Vuelo',
            avatar: 'Astronauta_taronja.jpg'
        };

        return await this.userRepo.saveDoc(newUserDoc);
    }

    async createStudent(teacherUsername, studentData) {
        const teacher = await this.userRepo.findByUsername(teacherUsername);
        if (!teacher || teacher.role !== 'TEACHER') {
            throw new Error("El usuario no es un profesor autorizado.");
        }

        const existing = await this.userRepo.findByUsername(studentData.username);
        if (existing) throw new Error("El nombre de usuario del alumno ya existe.");

        const student = {
            username: studentData.username,
            pass: studentData.password,
            plan: 'GRUPAL',
            role: 'STUDENT',
            parentId: teacher.username,
            coins: 100,
            xp: 0,
            level: 1
        };

        const newUserDoc = {
            user: student.username,
            pass: student.pass,
            plan: student.plan,
            role: student.role,
            parentId: student.parentId,
            coins: student.coins,
            xp: student.xp,
            level: student.level,
            rank: 'Recluta Espacial',
            avatar: 'Astronauta_blanc.jpg'
        };

        return await this.userRepo.saveDoc(newUserDoc);
    }

    async getMembers(parentUsername) {
        // Buscamos usuarios cuyo parentId sea el username del padre
        const collection = this.userRepo.collection;
        const members = await collection.find({ parentId: parentUsername }).toArray();
        return members.map(m => ({
            username: m.user,
            role: m.role,
            level: m.level,
            rank: m.rank,
            avatar: m.avatar
        }));
    }

    async getCenterGlobalStats(centerUsername) {
        // Aquí agregaríamos stats de todos los profes y alumnos del centro
        // Por ahora devolvemos la lista de profes para que el frontend pueda iterar
        return await this.getMembers(centerUsername);
    }
}

module.exports = GroupService;
