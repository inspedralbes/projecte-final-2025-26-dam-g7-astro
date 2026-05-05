
import { defineStore } from 'pinia';
import { requestJson } from './astroShared';

export const useGroupStore = defineStore('group', {
    state: () => ({
        members: [], // Profesores o alumnos según el rol
        currentStats: null, // Stats de clase o globales
        supplySets: [],
        activeSupplySet: null,
        loading: false,
        error: null
    }),

    actions: {
        async fetchMembers(username) {
            this.loading = true;
            try {
                const { response, data } = await requestJson(`/api/group/members/${username}`);
                if (response.ok) {
                    this.members = data;
                }
            } catch (error) {
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },

        async createTeacher(centerUsername, teacherData) {
            try {
                const { response, data } = await requestJson('/api/group/teacher', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ centerUsername, ...teacherData })
                });
                return { success: response.ok, message: data.message };
            } catch (error) {
                return { success: false, message: error.message };
            }
        },

        async createStudent(teacherUsername, studentData) {
            try {
                const { response, data } = await requestJson('/api/group/student', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherUsername, ...studentData })
                });
                return { success: response.ok, message: data.message };
            } catch (error) {
                return { success: false, message: error.message };
            }
        },

        async fetchClassStats(teacherUsername) {
            try {
                const { response, data } = await requestJson(`/api/group/stats/class/${teacherUsername}`);
                if (response.ok) this.currentStats = data;
            } catch (error) {
                this.error = error.message;
            }
        },

        async fetchCenterStats(centerUsername) {
            try {
                const { response, data } = await requestJson(`/api/group/stats/center/${centerUsername}`);
                if (response.ok) this.currentStats = data;
            } catch (error) {
                this.error = error.message;
            }
        },

        // --- SUMINISTROS (SUPPLY SETS) ---
        async fetchSupplySets(ownerId) {
            try {
                const { response, data } = await requestJson(`/api/supplies/${ownerId}`);
                if (response.ok) this.supplySets = data;
            } catch (error) {
                this.error = error.message;
            }
        },

        async saveSupplySet(supplyData) {
            try {
                const { response, data } = await requestJson('/api/supplies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(supplyData)
                });
                return { success: response.ok, data };
            } catch (error) {
                return { success: false, message: error.message };
            }
        },

        async activateSupplySet(id, ownerId) {
            try {
                const { response } = await requestJson(`/api/supplies/activate/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ownerId })
                });
                return response.ok;
            } catch (error) {
                return false;
            }
        },

        async fetchActiveSupplySetForStudent(studentUsername) {
            try {
                const { response, data } = await requestJson(`/api/supplies/active/${studentUsername}`);
                if (response.ok) this.activeSupplySet = data;
            } catch (error) {
                console.error("Error fetching active supplies:", error);
            }
        }
    }
});
