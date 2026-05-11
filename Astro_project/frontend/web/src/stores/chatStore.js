import { defineStore } from 'pinia'
import { useMultiplayerStore } from './multiplayerStore'
import { useSessionStore } from './sessionStore'

export const useChatStore = defineStore('chat', {
  state: () => ({
    isOpen: false,
    activeFriend: null,
    conversations: {},
    unreadCounts: {},
  }),

  getters: {
    activeMessages (state) {
      if (!state.activeFriend) {
        return []
      }
      return state.conversations[state.activeFriend.user] || []
    },

    totalUnread (state) {
      return Object.values(state.unreadCounts).reduce((a, b) => a + b, 0)
    },

    activeUnread (state) {
      if (!state.activeFriend) {
        return 0
      }
      return state.unreadCounts[state.activeFriend.user] || 0
    },
  },

  actions: {
    _getSocket () {
      return useMultiplayerStore().socket
    },

    _getMyUser () {
      return useSessionStore().user
    },

    async _ensureConnected () {
      const multiplayerStore = useMultiplayerStore()
      if (multiplayerStore.socket && multiplayerStore.socket.readyState === WebSocket.OPEN) {
        return true
      }

      multiplayerStore.connect()
      return new Promise(resolve => {
        const timeout = setTimeout(() => resolve(false), 5000)
        const interval = setInterval(() => {
          if (multiplayerStore.socket && multiplayerStore.socket.readyState === WebSocket.OPEN) {
            clearInterval(interval)
            clearTimeout(timeout)
            resolve(true)
          }
        }, 100)
      })
    },

    async openChat (friend) {
      this.activeFriend = friend
      this.isOpen = true

      if (this.unreadCounts[friend.user]) {
        this.unreadCounts[friend.user] = 0
      }

      if (!this.conversations[friend.user]) {
        this.conversations[friend.user] = []
      }

      const connected = await this._ensureConnected()
      if (!connected) {
        return
      }

      const socket = useMultiplayerStore().socket
      socket.send(JSON.stringify({
        type: 'CHAT_FETCH_HISTORY',
        userA: this._getMyUser(),
        userB: friend.user,
      }))
    },

    closeChat () {
      this.isOpen = false
      this.activeFriend = null
    },

    async sendMessage (content) {
      if (!content?.trim() || !this.activeFriend) {
        return
      }

      const myUser = this._getMyUser()
      const connected = await this._ensureConnected()
      if (!connected) {
        return
      }

      const socket = useMultiplayerStore().socket
      socket.send(JSON.stringify({
        type: 'CHAT_SEND',
        from: myUser,
        to: this.activeFriend.user,
        content: content.trim(),
      }))
    },

    handleIncomingMessage (data) {
      const myUser = this._getMyUser()
      const friendUser = data.from === myUser ? data.to : data.from

      if (!this.conversations[friendUser]) {
        this.conversations[friendUser] = []
      }

      const isDuplicate = this.conversations[friendUser].some(
        m => m.from === data.from && m.at === data.at && m.content === data.content,
      )
      if (isDuplicate) {
        return
      }

      this.conversations[friendUser].push({
        from: data.from,
        to: data.to,
        content: data.content,
        at: data.at,
        read: data.from === myUser,
        msgType: data.msgType || 'text',
        status: data.status || (data.msgType === 'challenge' ? 'pending' : undefined),
      })

      if (data.from !== myUser) {
        const isActiveConversation = this.isOpen && this.activeFriend?.user === data.from
        if (!isActiveConversation) {
          this.unreadCounts[data.from] = (this.unreadCounts[data.from] || 0) + 1
        }
      }
    },

    handleHistory (data) {
      this.conversations[data.with] = data.messages || []
    },

    handleUnreadCounts (data) {
      this.unreadCounts = { ...data.counts }
    },

    setChallengeStatus (friendUser, status) {
      if (!friendUser) {
        return
      }
      const conversationKey = Object.keys(this.conversations).find(
        key => key.toLowerCase() === friendUser.toLowerCase(),
      ) || friendUser

      const messages = this.conversations[conversationKey]
      if (!messages) {
        return
      }

      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].msgType === 'challenge') {
          if (messages[i].status === status) {
            break
          }
          messages[i] = { ...messages[i], status }
          break
        }
      }
    },

    clearChat () {
      this.isOpen = false
      this.activeFriend = null
      this.conversations = {}
      this.unreadCounts = {}
    },
  },
})
