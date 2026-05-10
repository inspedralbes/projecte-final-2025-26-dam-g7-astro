import { defineStore } from 'pinia'
import { API_BASE_URL, requestJson } from './astroShared'
import { useChatStore } from './chatStore'
import { useSessionStore } from './sessionStore'
import { useSocialStore } from './socialStore'

function buildWsUrl () {
  // 1. Reemplazamos 'http' o 'https' por 'ws'
  let wsUrl = API_BASE_URL.replace(/^http/i, 'ws')

  // 2. Nos aseguramos de que no termine en barra /
  wsUrl = wsUrl.replace(/\/$/, '')

  // 3. Añadimos el endpoint '/ws' que espera Nginx
  return `${wsUrl}/ws`
}

export const useMultiplayerStore = defineStore('multiplayer', {
  state: () => ({
    socket: null,
    isConnected: false,
    room: null,
    availableRooms: [],
    invitations: [],
    challengeRequests: [], // AÑADIDO: Desafíos recibidos
    error: null,
    lastMessage: null,
    roundScores: {}, // Puntuaciones de la ronda actual en vivo
    remoteCursors: {}, // Coordenadas de compañeros { user: { x, y } }
    coopChatMessages: [], // AÑADIDO: Mensajes del mini-chat cooperativo
    subRole: null, // AÑADIDO: 'listener' o 'writer'
    partnerText: '', // AÑADIDO: Texto que está escribiendo el compañero
    partnerEmojis: [], // AÑADIDO: Emojis enviados por el compañero
    returnedPlayers: [], // Jugadores que han pulsado "Volver al lobby"
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  }),

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
        this.reconnectAttempts = 0 // Resetear intentos al conectar
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
          // Omitir log ruidoso de salas públicas si no es necesario
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

        // Intentar reconectar si no nos hemos desconectado manualmente
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`Intentando reconectar... (Intento ${this.reconnectAttempts})`)
          setTimeout(() => this.connect(), 2000 * this.reconnectAttempts) // Exponential backoff
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
      this.reconnectAttempts = this.maxReconnectAttempts // Prevenir reconexión automática
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
          // Evitar duplicados si ya hay uno del mismo usuario
          if (!this.challengeRequests.some(r => r.from === data.from)) {
            this.challengeRequests.push({ from: data.from })
            // Auto-limpiar el desafío tras 5 segundos si no se ha respondido
            setTimeout(() => {
              this.challengeRequests = this.challengeRequests.filter(r => r.from !== data.from)
            }, 5000)
          }
          break
        }
        case 'CHALLENGE_ACCEPTED': {
          // Ambos usuarios reciben esto. Redirigir al lobby de la nueva sala.
          this.joinRoom(data.roomId)
          this.lastMessage = data // Para que el componente global reaccione y redirija
          // Actualizar estado en el chat si está abierto
          useChatStore().setChallengeStatus(data.from === sessionStore.user ? data.to : data.from, 'accepted')
          break
        }
        case 'CHALLENGE_REJECTED': {
          this.lastMessage = data // Para mostrar notificación de rechazo
          // Actualizar estado en el chat
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
            // Actualizar subRole si existe la configuración
            if (data.room.gameConfig?.subRoles) {
              this.subRole = data.room.gameConfig.subRoles[sessionStore.user]
            }
          }
          break
        }
        case 'MATCH_STARTING': {
          this.roundScores = {} // Reset puntuacions en viu al començar nova partida
          this.remoteCursors = {} // Reset cursores
          this.partnerText = '' // Reset texto
          this.partnerEmojis = [] // Reset emojis
          this.lastMessage = null // LIMPIAR MENSAJE ANTERIOR PARA EVITAR CIERRES INSTANTÁNEOS
          this.room = { ...data.room }

          if (data.room.gameConfig?.subRoles) {
            this.subRole = data.room.gameConfig.subRoles[sessionStore.user]
          }

          console.log('🏁 ¡LA PARTIDA COMIENZA!', data.room.gameConfig.currentGame)
          break
        }
        case 'ROUND_ENDED_BY_WINNER': {
          console.log('🏁 Ronda terminada instantáneamente por:', data.winner)
          this.remoteCursors = {} // Limpiar cursores al acabar ronda
          this.partnerText = ''
          this.partnerEmojis = []
          if (this.room && data.scores) {
            this.room.gameConfig.scores = data.scores
          }
          this.lastMessage = data // Para que los componentes reaccionen
          break
        }
        case 'SCORE_UPDATE_LIVE': {
          this.roundScores[data.user] = data.score
          break
        }
        case 'GAME_ACTION': {
          // Manejar movimiento de ratón de compañeros
          if (data.action?.type === 'MOUSE_MOVE') {
            this.remoteCursors[data.from] = {
              x: data.action.x,
              y: data.action.y,
              isFiring: !!data.action.isFiring
            }
          }

          // AÑADIDO: Manejar texto del compañero
          if (data.action?.type === 'PARTNER_TYPING') {
            this.partnerText = data.action.text
          }

          // AÑADIDO: Manejar emojis del compañero
          if (data.action?.type === 'PARTNER_EMOJI') {
            this.partnerEmojis.push(data.action.emoji)
          }

          // AÑADIDO: Manejar chat cooperativo
          if (data.action?.type === 'COOP_CHAT') {
            this.coopChatMessages.push({
              from: data.from,
              text: data.action.text,
              timestamp: Date.now(),
            })
          }

          // AÑADIDO: Manejar destrucción de palabras (RhymeSquad)
          if (data.action?.type === 'WORD_DESTROYED') {
            this.lastMessage = data // Para que el componente RhymeSquad reaccione
          }

          this.lastMessage = data // Para que los componentes reaccionen (sabotaje)
          break
        }
        case 'ROUND_FINISHED': {
          this.roundScores = {} // Limpiar para la siguiente
          this.remoteCursors = {} // Limpiar cursores
          this.partnerText = ''
          this.partnerEmojis = []
          this.room = { ...data.room }

          if (data.room.gameConfig?.subRoles) {
            this.subRole = data.room.gameConfig.subRoles[sessionStore.user]
          }

          console.log('🏆 Ronda terminada. Ganador:', data.winner)
          break
        }
        case 'MATCH_FINISHED': {
          this.returnedPlayers = [] // Reset al acabar partida
          if (data.room) {
            this.room = { ...data.room }
          }
          this.lastMessage = data // Para que el lobby muestre el overlay de resultados
          console.log('👑 ¡PARTIDA TERMINADA! Ganador absoluto:', data.winner)
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
          console.log('🚪 Sala tancada pel servidor:', data.reason)
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

        // ── CHAT EN TIEMPO REAL ──────────────────────────────
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

        // ── ACTUALIZACIONES SOCIALES EN TIEMPO REAL ───────────
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
      console.log(`⚔️ Iniciando desafío para: ${friendName}`)

      if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.log('📡 WS no conectado. Intentando conectar antes de desafiar...')
        this.connect()
        // Esperar hasta 3 segundos a que conecte
        const connected = await new Promise((resolve) => {
          let attempts = 0
          const interval = setInterval(() => {
            attempts++
            if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
              clearInterval(interval)
              resolve(true)
            }
            if (attempts > 30) { // 3 segundos
              clearInterval(interval)
              resolve(false)
            }
          }, 100)
        })

        if (!connected) {
          console.error('❌ No se pudo establecer conexión para enviar el desafío.')
          this.error = 'Error de conexión. Inténtalo de nuevo.'
          return false
        }
      }

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('📤 Enviando mensaje CHALLENGE via WS...')
        this.socket.send(JSON.stringify({
          type: 'CHALLENGE',
          from: sessionStore.user,
          to: friendName,
        }))
        return true
      } else {
        console.error('❌ El socket no está en estado OPEN tras esperar.')
        return false
      }
    },

    respondToChallenge (challengerName, accepted) {
      const sessionStore = this.getSession()
      if (!this.isConnected || !this.socket) return

      this.socket.send(JSON.stringify({
        type: 'CHALLENGE_RESPONSE',
        from: sessionStore.user,
        to: challengerName,
        accepted,
      }))

      // Actualizar chat localmente para feedback inmediato
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
    },
  },
})
