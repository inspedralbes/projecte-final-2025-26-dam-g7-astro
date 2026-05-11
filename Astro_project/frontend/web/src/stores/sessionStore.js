import { defineStore } from 'pinia'
import {
  requestJson,
  SESSION_TIMEOUT_MS,
  STORAGE_KEYS,
  storageGetItem,
  storageRemoveItem,
  storageSetItem,
} from './astroShared'

function persistNullable (key, value) {
  if (value === null || value === undefined || value === '') {
    storageRemoveItem(key)
    return
  }
  storageSetItem(key, value)
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    user: storageGetItem(STORAGE_KEYS.user) || null,
    plan: storageGetItem(STORAGE_KEYS.plan) || 'INDIVIDUAL_FREE',
    rank: storageGetItem(STORAGE_KEYS.rank) || null,
    role: storageGetItem(STORAGE_KEYS.role) || null,
    parentId: storageGetItem(STORAGE_KEYS.parentId) || null,
    avatar: storageGetItem(STORAGE_KEYS.avatar) || 'Astronauta_blanc.jpg',
    selectedTitle: storageGetItem('astro_selected_title') || null,
    displayName: storageGetItem('astro_display_name') || null,
    nameChangesCount: Number(storageGetItem('astro_name_changes')) || 0,
    token: storageGetItem(STORAGE_KEYS.token) || null,
    lastActivity: Number(storageGetItem(STORAGE_KEYS.lastActivity)) || Date.now(),
    deletionScheduledAt: storageGetItem('astro_deletion_scheduled') || null,
    groupInvitations: [],
    groupApprovalRequests: [],
    scheduledPlanDowngrade: null,
    pendingGroupLeaveRequest: null,
    error: null,
  }),

  actions: {
    setUser (user) {
      this.user = user || null
      persistNullable(STORAGE_KEYS.user, this.user)
    },

    setPlan (plan) {
      this.plan = plan || 'INDIVIDUAL_FREE'
      persistNullable(STORAGE_KEYS.plan, this.plan)
    },

    setRank (rank) {
      this.rank = rank || null
      persistNullable(STORAGE_KEYS.rank, this.rank)
    },

    setRole (role) {
      this.role = role || null
      persistNullable(STORAGE_KEYS.role, this.role)
    },

    setParentId (parentId) {
      this.parentId = parentId || null
      persistNullable(STORAGE_KEYS.parentId, this.parentId)
    },

    setToken (token) {
      this.token = token || null
      persistNullable(STORAGE_KEYS.token, this.token)
      this.updateLastActivity()
    },

    updateLastActivity () {
      this.lastActivity = Date.now()
      storageSetItem(STORAGE_KEYS.lastActivity, this.lastActivity)
    },

    checkSessionExpiration () {
      if (!this.token) {
        return false
      }

      const lastActivity = Number(storageGetItem(STORAGE_KEYS.lastActivity))
      const now = Date.now()

      if (lastActivity && (now - lastActivity > SESSION_TIMEOUT_MS)) {
        console.warn('⚠️ Sesión expirada por inactividad.')
        this.clearSession()
        return true
      }
      return false
    },

    setAvatar (avatar) {
      this.avatar = avatar || 'Astronauta_blanc.jpg'
      persistNullable(STORAGE_KEYS.avatar, this.avatar)
    },

    setSelectedTitle (title) {
      this.selectedTitle = title || null
      persistNullable('astro_selected_title', this.selectedTitle)
    },

    setDisplayName (displayName) {
      this.displayName = displayName || null
      persistNullable('astro_display_name', this.displayName)
    },

    setNameChangesCount (count) {
      this.nameChangesCount = count || 0
      storageSetItem('astro_name_changes', this.nameChangesCount)
    },

    applyLoginPayload (data = {}) {
      const profile = data.profile || {}
      this.setUser(profile.name ?? this.user)
      this.setPlan(profile.plan ?? this.plan)
      this.setRank(profile.rank ?? this.rank)
      this.setRole(Object.prototype.hasOwnProperty.call(profile, 'role') ? profile.role : this.role)
      this.setParentId(Object.prototype.hasOwnProperty.call(profile, 'parentId') ? profile.parentId : this.parentId)
      this.setToken(data.token ?? this.token)

      if (profile.avatar) {
        this.setAvatar(profile.avatar)
      }
      if (profile.selectedTitle !== undefined) {
        this.setSelectedTitle(profile.selectedTitle)
      }
      if (profile.displayName !== undefined) {
        this.setDisplayName(profile.displayName)
      }
      if (profile.nameChangesCount !== undefined) {
        this.setNameChangesCount(profile.nameChangesCount)
      }
      if (profile.deletionScheduledAt !== undefined) {
        this.setDeletionScheduled(profile.deletionScheduledAt)
      }
      if (profile.groupInvitations !== undefined) {
        this.setGroupInvitations(profile.groupInvitations)
      }
      if (profile.groupApprovalRequests !== undefined) {
        this.setGroupApprovalRequests(profile.groupApprovalRequests)
      }
      if (profile.scheduledPlanDowngrade !== undefined) {
        this.setScheduledPlanDowngrade(profile.scheduledPlanDowngrade)
      }
      if (profile.pendingGroupLeaveRequest !== undefined) {
        this.setPendingGroupLeaveRequest(profile.pendingGroupLeaveRequest)
      }
    },

    setDeletionScheduled (date) {
      this.deletionScheduledAt = date || null
      persistNullable('astro_deletion_scheduled', this.deletionScheduledAt)
    },

    setGroupInvitations (invitations = []) {
      this.groupInvitations = Array.isArray(invitations) ? invitations : []
    },

    setGroupApprovalRequests (requests = []) {
      this.groupApprovalRequests = Array.isArray(requests) ? requests : []
    },

    setScheduledPlanDowngrade (scheduled = null) {
      this.scheduledPlanDowngrade = scheduled || null
    },

    setPendingGroupLeaveRequest (pending = null) {
      this.pendingGroupLeaveRequest = pending || null
    },

    async registerTripulante (userData) {
      this.error = null
      try {
        const { response, data } = await requestJson('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          throw new Error(data.message || 'Error al registrar')
        }

        return { success: true, message: data.message }
      } catch (error) {
        console.error('❌ Error en registro:', error)
        this.error = error.message
        return { success: false, message: this.error }
      }
    },

    async loginTripulante (credentials) {
      this.error = null
      try {
        const { response, data } = await requestJson('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: credentials.username || credentials.user,
            password: credentials.password || credentials.pass,
          }),
        })

        if (!response.ok) {
          throw new Error(data.message || 'Error de autenticación')
        }

        this.applyLoginPayload(data)
        this.updateLastActivity()
        return { success: true, data }
      } catch (error) {
        console.error('❌ Error en login:', error)
        this.error = error.message
        return { success: false, message: this.error }
      }
    },

    async updatePlan (planType, options = {}) {
      this.error = null
      if (!this.user) {
        this.user = storageGetItem(STORAGE_KEYS.user)
      }

      if (!this.user) {
        this.error = 'Usuario no identificado para actualizar el plan.'
        return { success: false, message: this.error }
      }

      try {
        const { response, data } = await requestJson('/api/user/plan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: this.user,
            plan: planType,
            groupType: options.groupType || null,
            role: options.role || null,
          }),
        })

        if (!response.ok) {
          throw new Error(data.message || 'Error al actualizar el plan en el servidor')
        }

        this.setPlan(data.profile?.plan || planType)
        this.setRole(data.profile?.role || null)
        this.setParentId(data.profile?.parentId || null)
        if (data.profile?.scheduledPlanDowngrade !== undefined) {
          this.setScheduledPlanDowngrade(data.profile.scheduledPlanDowngrade)
        }

        return { success: true }
      } catch (error) {
        console.error('❌ Error sincronizando plan:', error)
        this.error = 'Error al conectar con el servidor: ' + error.message
        return { success: false, message: this.error }
      }
    },

    async updateAvatar (seed) {
      this.setAvatar(seed)
      console.log('👤 Avatar actualizado localmente:', seed)

      if (!this.user) {
        return
      }

      try {
        const { response, data } = await requestJson('/api/user/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: this.user,
            avatar: seed,
          }),
        })

        if (!response.ok) {
          throw new Error(data.message || 'Error al guardar avatar en servidor')
        }
        console.log('✅ Avatar sincronizado en servidor')
      } catch (error) {
        console.error('❌ Error sincronizando avatar:', error)
      }
    },

    async updateSelectedTitle (title) {
      this.setSelectedTitle(title)
      console.log('👑 Título actualizado localmente:', title)

      if (!this.user) {
        return
      }

      try {
        const { response, data } = await requestJson('/api/user/title', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: this.user,
            title,
          }),
        })

        if (!response.ok) {
          throw new Error(data.message || 'Error al guardar título en servidor')
        }
        console.log('✅ Título sincronizado en servidor')
      } catch (error) {
        console.error('❌ Error sincronizando título:', error)
      }
    },

    async changePassword (oldPassword, newPassword) {
      this.error = null
      if (!this.user) {
        this.error = 'Usuario no identificado.'
        return { success: false, message: this.error }
      }

      try {
        const { response, data } = await requestJson('/api/user/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: this.user,
            oldPassword,
            newPassword,
          }),
        })

        if (!response.ok) {
          throw new Error(data.message || 'Error al cambiar la contraseña')
        }

        return { success: true, message: data.message || 'Contraseña actualizada correctamente' }
      } catch (error) {
        console.error('❌ Error cambiando contraseña:', error)
        this.error = error.message || 'Error al cambiar la contraseña'
        return { success: false, message: this.error }
      }
    },

    async requestGroupOwnerDowngrade (password, targetPlan = 'INDIVIDUAL_FREE') {
      if (!this.user) {
        return { success: false, message: 'Usuario no identificado' }
      }

      try {
        const { response, data } = await requestJson('/api/user/plan/group-owner/downgrade-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: this.user, password, targetPlan }),
        })

        if (!response.ok) {
          throw new Error(data.message || 'No se pudo programar la baja del plan grupal')
        }

        this.setScheduledPlanDowngrade(data.scheduledPlanDowngrade)
        return { success: true, scheduledPlanDowngrade: data.scheduledPlanDowngrade }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async cancelGroupOwnerDowngrade () {
      if (!this.user) {
        return { success: false, message: 'Usuario no identificado' }
      }

      try {
        const { response, data } = await requestJson('/api/user/plan/group-owner/downgrade-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: this.user }),
        })

        if (!response.ok) {
          throw new Error(data.message || 'No se pudo cancelar la baja grupal')
        }

        this.setScheduledPlanDowngrade(null)
        return { success: true }
      } catch (error) {
        return { success: false, message: error.message }
      }
    },

    async scheduleAccountDeletion () {
      if (!this.user) {
        return { success: false, message: 'Usuario no identificado' }
      }
      try {
        const { response, data } = await requestJson('/api/user/delete-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: this.user }),
        })
        if (!response.ok) {
          throw new Error(data.message || 'Error al solicitar eliminación')
        }

        this.setDeletionScheduled(data.deletionScheduledAt)
        return { success: true }
      } catch (error) {
        console.error('❌ Error solicitando eliminación:', error)
        return { success: false, message: error.message }
      }
    },

    async cancelAccountDeletion () {
      if (!this.user) {
        return { success: false, message: 'Usuario no identificado' }
      }
      try {
        const { response, data } = await requestJson('/api/user/delete-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: this.user }),
        })
        if (!response.ok) {
          throw new Error(data.message || 'Error al cancelar eliminación')
        }

        this.setDeletionScheduled(null)
        return { success: true }
      } catch (error) {
        console.error('❌ Error cancelando eliminación:', error)
        return { success: false, message: error.message }
      }
    },

    clearSession () {
      this.user = null
      this.plan = 'INDIVIDUAL_FREE'
      this.rank = null
      this.role = null
      this.parentId = null
      this.avatar = 'Astronauta_blanc.jpg'
      this.selectedTitle = null
      this.displayName = null
      this.nameChangesCount = 0
      this.token = null
      this.deletionScheduledAt = null
      this.groupInvitations = []
      this.groupApprovalRequests = []
      this.scheduledPlanDowngrade = null
      this.pendingGroupLeaveRequest = null
      this.error = null

      // Limpiar ambos (Persistent y Session) por seguridad
      for (const key of [
        STORAGE_KEYS.token,
        STORAGE_KEYS.user,
        STORAGE_KEYS.rank,
        STORAGE_KEYS.role,
        STORAGE_KEYS.parentId,
        STORAGE_KEYS.plan,
        STORAGE_KEYS.avatar,
        STORAGE_KEYS.lastActivity,
        'astro_selected_title',
        'astro_display_name',
        'astro_name_changes',
        'astro_deletion_scheduled',
      ]) {
        storageRemoveItem(key, false) // Session
        storageRemoveItem(key, true) // Local
      }
    },
  },
})
