import { defineStore } from 'pinia'
import { API_BASE_URL, requestJson } from './astroShared'
import { useChatStore } from './chatStore'
import { useSessionStore } from './sessionStore'
import { useSocialStore } from './socialStore'
import { useAstroStore } from './astroStore'
import { useProgressStore } from './progressStore'

function buildWsUrl () {
  let wsUrl = API_BASE_URL.replace(/^http/i, 'ws')
  wsUrl = wsUrl.replace(/\/$/, '')
  return `${wsUrl}/ws`
}

export const useMultiplayerStore = defineStore('multiplayer', {
  state: () => ({
    socket: null,
    isConnected: false,
    room: null,
    availableRooms: [],
    invitations: [],
    challengeRequests: [],
    error: null,
    lastMessage: null,
    roundScores: {},
    remoteCursors: {},
    coopChatMessages: [],
    subRole: null,
    partnerText: '',
    partnerEmojis: [],
    returnedPlayers: [],
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    timeLeft: 0,
    // --- RACE MODE STATE ---
    raceFuel: 100,
    raceProgress: 'START',
    partnerProgress: 'START',
    completedPlanets: [],
    fuelInterval: null,
  }),

  getters: {
    isInGame (state) {
      return state.room?.status === 'PLAYING'
    },
  },

  actions: {
    getSession () {
      return useSessionStore()
    },

    async fetchAvailableRooms () {
      try {
        const { response, data } = await requestJson('/api/multiplayer/rooms')
        if (response.ok) {
          this.availableRooms = data
        }
      } catch (error) {
        console.error('❌ Error cargando salas:', error)
      }
    },

    connect () {
      const sessionStore = this.getSession()
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        return
      }

      const ws = new WebSocket(buildWsUrl())

      ws.addEventListener('open', () => {
        this.isConnected = true
        this.socket = ws
        this.reconnectAttempts = 0
        console.log('🚀 Conexión Multijugador establecida')

        ws.send(JSON.stringify({
          type: 'IDENTIFY',
          user: sessionStore.user,
          token: sessionStore.token,
        }))
      })

      ws.addEventListener('message', event => {
        try {
          const data = JSON.parse(event.data)
          if (data.type !== 'GLOBAL_ROOMS_UPDATE' && data.action?.type !== 'MOUSE_MOVE') {
            console.log(`📩 [WS] Recibido: ${data.type}`, data)
          }
          this.handleMessage(data)
        } catch (error) {
          console.error('❌ Error procesando mensaje:', error)
        }
      })

      ws.addEventListener('close', () => {
        this.isConnected = false
        this.socket = null
        this.room = null
        console.warn('⚠️ Conexión Multijugador cerrada')

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`Intentando reconectar... (Intento ${this.reconnectAttempts})`)
          setTimeout(() => this.connect(), 2000 * this.reconnectAttempts)
        }
      })

      ws.addEventListener('error', () => {
        this.error = 'No se pudo establecer conexión multijugador.'
      })
    },

    disconnect () {
      if (this.socket) {
        this.socket.close()
      }
      this.socket = null
      this.reconnectAttempts = this.maxReconnectAttempts
      this.isConnected = false
      this.room = null
      this.invitations = []
      this.challengeRequests = []
    },

    handleMessage (data) {
      const sessionStore = this.getSession()

      switch (data.type) {
        case 'INVITATION_RECEIVED': {
          this.invitations.push({ from: data.from, roomId: data.roomId })
          break
        }
        case 'CHALLENGE_RECEIVED': {
          if (!this.challengeRequests.some(r => r.from === data.from)) {
            this.challengeRequests.push({ from: data.from })
            setTimeout(() => {
              this.challengeRequests = this.challengeRequests.filter(r => r.from !== data.from)
            }, 5000)
          }
          break
        }
        case 'CHALLENGE_ACCEPTED': {
          this.joinRoom(data.roomId)
          this.lastMessage = data
          useChatStore().setChallengeStatus(data.from === sessionStore.user ? data.to : data.from, 'accepted')
          break
        }
        case 'CHALLENGE_REJECTED': {
          this.lastMessage = data
          useChatStore().setChallengeStatus(data.from === sessionStore.user ? data.to : data.from, 'rejected')
          break
        }
        case 'GLOBAL_ROOMS_UPDATE': {
          this.availableRooms = data.rooms
          break
        }
        case 'ROOM_CREATED': {
          this.joinRoom(data.roomId)
          break
        }
        case 'JOIN_SUCCESS': {
          this.room = { ...data.room }
          break
        }
        case 'ROOM_UPDATE': {
          if (data.room) {
            this.room = { ...data.room }
            if (data.room.gameConfig?.subRoles) {
              this.subRole = data.room.gameConfig.subRoles[sessionStore.user]
            }
          }
          break
        }
        case 'MATCH_STARTING': {
          this.roundScores = {}
          this.remoteCursors = {}
          this.partnerText = ''
          this.partnerEmojis = []
          this.lastMessage = null
          this.room = { ...data.room }

          if (data.room.gameConfig?.subRoles) {
            this.subRole = data.room.gameConfig.subRoles[sessionStore.user]
          }
          this.timeLeft = 60
          
          // Reset Race Mode state
          this.raceFuel = 100
          this.raceProgress = 0
          this.partnerProgress = 0
          this.stopFuelTimer()
          
          if (this.room?.gameConfig?.mode === 'RACE') {
            this.startFuelTimer()
          }
          break
        }
        case 'ROUND_ENDED_BY_WINNER': {
          this.remoteCursors = {}
          this.partnerText = ''
          this.partnerEmojis = []
          if (this.room && data.scores) {
            this.room.gameConfig.scores = data.scores
          }
          this.lastMessage = data
          break
        }
        case 'SCORE_UPDATE_LIVE': {
          this.roundScores[data.user] = data.score
          break
        }
        case 'GAME_ACTION': {
          if (data.action?.type === 'MOUSE_MOVE') {
            this.remoteCursors[data.from] = {
              x: data.action.x,
              y: data.action.y,
              isFiring: !!data.action.isFiring,
            }
          }

          if (data.action?.type === 'PARTNER_TYPING') {
            this.partnerText = data.action.text
          }

          if (data.action?.type === 'PARTNER_EMOJI') {
            this.partnerEmojis.push(data.action.emoji)
          }

          if (data.action?.type === 'COOP_CHAT') {
            this.coopChatMessages.push({
              from: data.from,
              text: data.action.text,
              timestamp: Date.now(),
            })
          }

          if (data.action?.type === 'WORD_DESTROYED') {
            this.lastMessage = data
          }

          if (data.action?.type === 'SCORE_UPDATE') {
            this.roundScores[data.from] = data.action.score
          }

          if (data.action?.type === 'TIME_SYNC') {
            this.timeLeft = data.action.timeLeft
          }

          if (data.action?.type === 'RACE_PROGRESS_UPDATE') {
            if (data.from !== sessionStore.user) {
              this.partnerProgress = data.action.progress
              if (data.action.completed) {
                // Sincronizar planetas completados del rival si fuera necesario
              }
            }
          }

          if (data.action?.type === 'FUEL_RECHARGE') {
            this.rechargeFuel(data.action.amount)
          }

          this.lastMessage = data
          break
        }
        case 'ROUND_FINISHED': {
          this.roundScores = {}
          this.remoteCursors = {}
          this.partnerText = ''
          this.partnerEmojis = []
          this.room = { ...data.room }
          this.lastMessage = null // Limpiamos para la nueva ronda

          if (data.room.gameConfig?.subRoles) {
            this.subRole = data.room.gameConfig.subRoles[sessionStore.user]
          }
          this.timeLeft = 60
          break
        }
        case 'MATCH_FINISHED': {
          this.returnedPlayers = []
          if (data.room) {
            this.room = { ...data.room }
          }
          this.lastMessage = data
          this.stopFuelTimer()

          // Actualizar estadísticas tras partida multijugador
          const astroStore = useAstroStore()
          astroStore.fetchUserStats()

          break
        }
        case 'PLAYER_RETURNED': {
          this.lastMessage = data
          if (data.user && !this.returnedPlayers.includes(data.user)) {
            this.returnedPlayers.push(data.user)
          }
          break
        }
        case 'ROOM_CLOSED': {
          this.room = null
          this.lastMessage = data
          break
        }
        case 'GAME_ROLES_SWAPPED': {
          if (data.subRoles) {
            this.subRole = data.subRoles[sessionStore.user]
          }
          this.lastMessage = data
          break
        }
        case 'ERROR': {
          this.error = data.message
          break
        }
        case 'CHAT_MESSAGE': {
          useChatStore().handleIncomingMessage(data)
          break
        }
        case 'CHAT_HISTORY': {
          useChatStore().handleHistory(data)
          break
        }
        case 'CHAT_UNREAD_COUNTS': {
          useChatStore().handleUnreadCounts(data)
          break
        }
        case 'FRIEND_UPDATE': {
          useSocialStore().setFriends(data.friends)
          useSocialStore().fetchAllUsers()
          break
        }
        case 'FRIEND_REQUEST_UPDATE': {
          useSocialStore().setFriendRequests(data.friendRequests)
          useSocialStore().fetchAllUsers()
          break
        }
        case 'FRIEND_ACCEPT_NOTIF': {
          useSocialStore().setFriends(data.friends)
          useSocialStore().setFriendRequests(data.friendRequests)
          useSocialStore().fetchAllUsers()
          break
        }
        case 'GROUP_INVITATION_UPDATE': {
          sessionStore.setGroupInvitations(data.groupInvitations || [])
          break
        }
        case 'GROUP_APPROVAL_UPDATE': {
          sessionStore.setGroupApprovalRequests(data.groupApprovalRequests || [])
          break
        }
        case 'GROUP_MEMBERSHIP_UPDATE': {
          if (data.profile) {
            sessionStore.setPlan(data.profile.plan || sessionStore.plan)
            sessionStore.setRole(data.profile.role || null)
            sessionStore.setParentId(data.profile.parentId || null)
            if (Object.prototype.hasOwnProperty.call(data.profile, 'pendingGroupLeaveRequest')) {
              sessionStore.setPendingGroupLeaveRequest(data.profile.pendingGroupLeaveRequest)
            } else if (!data.profile.parentId) {
              sessionStore.setPendingGroupLeaveRequest(null)
            }
          }
          if (Array.isArray(data.groupInvitations)) {
            sessionStore.setGroupInvitations(data.groupInvitations)
          }
          break
        }
        case 'PROFILE_UPDATE': {
          const astroStore = useAstroStore()
          if (data.coins !== undefined) astroStore.setCoins(data.coins)
          if (data.inventory !== undefined) astroStore.setInventory(data.inventory)
          if (data.streakFreezes !== undefined) {
            const progressStore = useProgressStore()
            progressStore.setStreakFreezes(data.streakFreezes)
          }
          if (data.dailyPurchaseHistory !== undefined) {
            sessionStore.setDailyPurchaseHistory(data.dailyPurchaseHistory)
          }
          if (data.selectedTitle !== undefined) {
            sessionStore.setSelectedTitle(data.selectedTitle)
          }
          if (data.avatar !== undefined) {
            sessionStore.setAvatar(data.avatar)
          }
          break
        }
        default: {
          break
        }
      }
    },

    updateGameConfig (config) {
      if (!this.isConnected || !this.room || !this.socket) {
        return
      }
      this.socket.send(JSON.stringify({
        type: 'UPDATE_GAME_CONFIG',
        roomId: this.room.id,
        config,
      }))
    },

    startMatch () {
      if (!this.isConnected || !this.room || !this.socket) {
        return
      }
      this.socket.send(JSON.stringify({
        type: 'START_MATCH',
        roomId: this.room.id,
      }))
    },

    setRoomStatus (status) {
      if (!this.isConnected || !this.room || !this.socket) {
        return
      }
      this.socket.send(JSON.stringify({
        type: 'SET_ROOM_STATUS',
        roomId: this.room.id,
        status,
      }))
    },

    submitRoundResult () {
      const sessionStore = useSessionStore()
      if (!this.isConnected || !this.room || !this.socket) {
        return
      }
      this.socket.send(JSON.stringify({
        type: 'SUBMIT_ROUND_RESULT',
        roomId: this.room.id,
        user: sessionStore.user,
      }))
    },

    returnToLobby () {
      const sessionStore = useSessionStore()
      if (!this.isConnected || !this.room || !this.socket) {
        return
      }
      this.socket.send(JSON.stringify({
        type: 'PLAYER_RETURN_TO_LOBBY',
        roomId: this.room.id,
        user: sessionStore.user,
      }))
    },

    sendGameAction (action) {
      const sessionStore = useSessionStore()
      if (!this.isConnected || !this.room || !this.socket) {
        return
      }

      // Si el host envía una sincronización de tiempo, la actualizamos localmente también
      if (action.type === 'TIME_SYNC') {
        this.timeLeft = action.timeLeft
      }

      this.socket.send(JSON.stringify({
        type: 'GAME_ACTION',
        roomId: this.room.id,
        user: sessionStore.user,
        action,
      }))
    },

    sendEmojiClue (emoji) {
      this.sendGameAction({
        type: 'EMOJI_CHAT',
        emoji,
      })
    },

    async sendChallenge (friendName) {
      const sessionStore = this.getSession()
      if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.connect()
        const connected = await new Promise(resolve => {
          let attempts = 0
          const interval = setInterval(() => {
            attempts++
            if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
              clearInterval(interval)
              resolve(true)
            }
            if (attempts > 30) {
              clearInterval(interval)
              resolve(false)
            }
          }, 100)
        })
        if (!connected) {
          return false
        }
      }
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'CHALLENGE',
          from: sessionStore.user,
          to: friendName,
        }))
        return true
      }
      return false
    },

    respondToChallenge (challengerName, accepted) {
      const sessionStore = this.getSession()
      if (!this.isConnected || !this.socket) {
        return
      }
      this.socket.send(JSON.stringify({
        type: 'CHALLENGE_RESPONSE',
        from: sessionStore.user,
        to: challengerName,
        accepted,
      }))
      useChatStore().setChallengeStatus(challengerName, accepted ? 'accepted' : 'rejected')
      this.challengeRequests = this.challengeRequests.filter(r => r.from !== challengerName)
    },

    createRoom (userAccount, isPublic = true, maxPlayers = 4, gameConfig = {}) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'CREATE_ROOM',
          user: userAccount,
          isPublic,
          maxPlayers,
          gameConfig,
        }))
      }
    },

    joinRoom (roomId) {
      const sessionStore = this.getSession()
      if (!this.isConnected || !this.socket) {
        return
      }
      this.socket.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomId,
        user: sessionStore.user,
      }))
    },

    inviteFriend (friendName) {
      const sessionStore = this.getSession()
      if (!this.isConnected || !this.room || !this.socket) {
        return
      }
      this.socket.send(JSON.stringify({
        type: 'INVITE',
        from: sessionStore.user,
        to: friendName,
        roomId: this.room.id,
      }))
    },

    leaveRoom () {
      const sessionStore = this.getSession()
      if (!this.isConnected || !this.room || !this.socket) {
        return
      }
      this.socket.send(JSON.stringify({
        type: 'LEAVE_ROOM',
        roomId: this.room.id,
        user: sessionStore.user,
      }))
      this.room = null
      this.stopFuelTimer()
    },

    // --- RACE MODE ACTIONS ---
    updateRaceProgress (id, isCompleted = false) {
      const sessionStore = this.getSession()
      this.raceProgress = id
      if (isCompleted && !this.completedPlanets.includes(id)) {
        this.completedPlanets.push(id)
      }
      if (!this.isConnected || !this.room || !this.socket) return

      this.socket.send(JSON.stringify({
        type: 'GAME_ACTION',
        roomId: this.room.id,
        user: sessionStore.user,
        action: {
          type: 'RACE_PROGRESS_UPDATE',
          progress: id,
          completed: isCompleted,
        },
      }))
    },

    rechargeFuel (amount = 20) {
      this.raceFuel = Math.min(100, this.raceFuel + amount)
    },

    consumeFuel (amount = 10) {
      this.raceFuel = Math.max(0, this.raceFuel - amount)
    },

    startFuelTimer () {
      this.stopFuelTimer()
      this.raceFuel = 100
      this.fuelInterval = setInterval(() => {
        if (this.raceFuel > 0) {
          this.raceFuel -= 0.2 // Baja 0.2% cada medio segundo (0.4% por segundo)
          if (this.raceFuel <= 0) {
            this.raceFuel = 0
            this.stopFuelTimer()
            // El componente HUD o el Game Manager detectarán el 0 y activarán Game Over
          }
        }
      }, 500)
    },

    stopFuelTimer () {
      if (this.fuelInterval) {
        clearInterval(this.fuelInterval)
        this.fuelInterval = null
      }
    },
  },
})
