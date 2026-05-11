import { defineStore } from 'pinia'
import { requestJson } from './astroShared'

export const useGroupStore = defineStore('group', {
  state: () => ({
    members: [], // Profesores o alumnos según el rol
    currentStats: null, // Stats de clase o globales
    supplySets: [],
    activeSupplySet: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchMembers (username) {
      this.loading = true
      try {
        const { response, data } = await requestJson(`/api/group/members/${username}`)
        if (response.ok) {
          this.members = data
        }
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async createTeacher (centerUsername, teacherData) {
      try {
        const { response, data } = await requestJson('/api/group/teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ centerUsername, ...teacherData }),
        })
        return { success: response.ok, message: data.message }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async createStudent (teacherUsername, studentData) {
      try {
        const { response, data } = await requestJson('/api/group/student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacherUsername, ...studentData }),
        })
        return { success: response.ok, message: data.message }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async createMember (managerUsername, role, memberData) {
      try {
        const { response, data } = await requestJson('/api/group/member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ managerUsername, role, ...memberData }),
        })
        return { success: response.ok, message: data.message, data }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async inviteExistingMember (managerUsername, invitedUsername, role) {
      try {
        const { response, data } = await requestJson('/api/group/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ managerUsername, invitedUsername, role }),
        })
        return { success: response.ok, message: data.message, invitation: data.invitation }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async acceptGroupInvitation (invitationId, username) {
      try {
        const { response, data } = await requestJson('/api/group/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: username, invitationId }),
        })
        return { success: response.ok, message: data.message, profile: data.profile }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async rejectGroupInvitation (invitationId, username) {
      try {
        const { response, data } = await requestJson('/api/group/invite/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: username, invitationId }),
        })
        return { success: response.ok, message: data.message }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async requestLeaveToIndividual (username) {
      try {
        const { response, data } = await requestJson('/api/group/leave/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: username }),
        })
        return { success: response.ok, message: data.message, request: data.request }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async fetchApprovalRequests (username) {
      try {
        const { response, data } = await requestJson(`/api/group/approvals/${username}`)
        return { success: response.ok, requests: data.requests || [], message: data.message }
      } catch (error) {
        return { success: false, requests: [], message: error.message }
      }
    },

    async approveLeaveRequest (approverUsername, requestId) {
      try {
        const { response, data } = await requestJson('/api/group/leave/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approverUsername, requestId }),
        })
        return { success: response.ok, message: data.message, profile: data.profile }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async rejectLeaveRequest (approverUsername, requestId) {
      try {
        const { response, data } = await requestJson('/api/group/leave/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approverUsername, requestId }),
        })
        return { success: response.ok, message: data.message }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async fetchClassStats (teacherUsername) {
      try {
        const { response, data } = await requestJson(`/api/group/stats/class/${teacherUsername}`)
        if (response.ok) {
          this.currentStats = data
        }
      } catch (error) {
        this.error = error.message
      }
    },

    async fetchCenterStats (centerUsername) {
      try {
        const { response, data } = await requestJson(`/api/group/stats/center/${centerUsername}`)
        if (response.ok) {
          this.currentStats = data
        }
      } catch (error) {
        this.error = error.message
      }
    },

    // --- SUMINISTROS (SUPPLY SETS) ---
    async fetchSupplySets (ownerId) {
      try {
        const { response, data } = await requestJson(`/api/supplies/${ownerId}`)
        if (response.ok) {
          this.supplySets = data
        }
      } catch (error) {
        this.error = error.message
      }
    },

    async fetchCenterSupplies (centerId) {
      try {
        const { response, data } = await requestJson(`/api/supplies/center/${centerId}`)
        if (response.ok) {
          this.supplySets = data
        }
      } catch (error) {
        this.error = error.message
      }
    },

    async saveSupplySet (supplyData) {
      try {
        const { response, data } = await requestJson('/api/supplies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supplyData),
        })
        return { success: response.ok, data }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async activateSupplySet (id, ownerId, gameId) {
      try {
        const { response } = await requestJson(`/api/supplies/activate/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId, gameId }),
        })
        return response.ok
      } catch {
        return false
      }
    },

    async deleteSupplySet (id) {
      try {
        const { response } = await requestJson(`/api/supplies/${id}`, {
          method: 'DELETE',
        })
        return response.ok
      } catch {
        return false
      }
    },

    async fetchActiveSupplySetForStudent (studentUsername, gameId = null) {
      try {
        const url = gameId
          ? `/api/supplies/active/${studentUsername}/${gameId}`
          : `/api/supplies/active/${studentUsername}`
        const { response, data } = await requestJson(url)
        if (response.ok) {
          this.activeSupplySet = data
        }
      } catch (error) {
        console.error('Error fetching active supplies:', error)
      }
    },
  },
})
