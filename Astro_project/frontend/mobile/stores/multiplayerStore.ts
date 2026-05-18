import { create } from 'zustand';
import { WS_BASE_URL, requestJson } from '../utils/astroShared';
import { useSessionStore } from './sessionStore';

interface Room {
  id: string;
  status: string;
  players: any[];
  maxPlayers: number;
  gameConfig: any;
}

interface MultiplayerState {
  socket: WebSocket | null;
  isConnected: boolean;
  room: Room | null;
  availableRooms: any[];
  invitations: any[];
  challengeRequests: any[];
  error: string | null;
  lastMessage: any;
  roundScores: Record<string, number>;
  remoteCursors: Record<string, { x: number; y: number; isFiring: boolean }>;
  coopChatMessages: any[];
  subRole: string | null;
  partnerText: string;
  partnerEmojis: string[];
  returnedPlayers: string[];
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  timeLeft: number;
  
  // Race Mode State
  raceFuel: number;
  raceProgress: string | number;
  partnerProgress: string | number;
  completedPlanets: string[];
  fuelInterval: any | null;

  // Actions
  fetchAvailableRooms: () => Promise<void>;
  connect: () => void;
  disconnect: () => void;
  handleMessage: (data: any) => void;
  updateGameConfig: (config: any) => void;
  startMatch: () => void;
  setRoomStatus: (status: string) => void;
  submitRoundResult: () => void;
  returnToLobby: () => void;
  sendGameAction: (action: any) => void;
  sendEmojiClue: (emoji: string) => void;
  sendChallenge: (friendName: string) => Promise<boolean>;
  respondToChallenge: (challengerName: string, accepted: boolean) => void;
  createRoom: (userAccount: any, isPublic?: boolean, maxPlayers?: number, gameConfig?: any) => void;
  joinRoom: (roomId: string) => void;
  inviteFriend: (friendName: string) => void;
  leaveRoom: () => void;
  
  // Race Mode Actions
  updateRaceProgress: (id: string, isCompleted?: boolean) => void;
  rechargeFuel: (amount?: number) => void;
  consumeFuel: (amount?: number) => void;
  startFuelTimer: () => void;
  stopFuelTimer: () => void;
}

const sanitizeRoom = (room: any): Room | null => {
  if (!room) return null;
  return {
    ...room,
    players: (room.players || []).map((p: any) => {
      if (typeof p === 'string') return p;
      if (typeof p === 'object' && p !== null) {
        return p.username || p.user || p.name || 'Astronauta';
      }
      return 'Astronauta';
    })
  };
};

const sanitizeUser = (userRaw: any): string | null => {
  if (!userRaw) return null;
  if (typeof userRaw === 'string') return userRaw;
  if (typeof userRaw === 'object' && userRaw !== null) {
    return userRaw.username || userRaw.user || userRaw.name || null;
  }
  return null;
};

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
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
  raceFuel: 100,
  raceProgress: 'START',
  partnerProgress: 'START',
  completedPlanets: [],
  fuelInterval: null,

  fetchAvailableRooms: async () => {
    try {
      const { response, data } = await requestJson('/api/multiplayer/rooms');
      if (response.ok) {
        const sanitizedRooms = (data || []).map(sanitizeRoom);
        set({ availableRooms: sanitizedRooms });
      }
    } catch (error) {
      console.error('❌ Error cargando salas:', error);
    }
  },

  connect: () => {
    const { socket, reconnectAttempts, maxReconnectAttempts } = get();
    if (socket && socket.readyState === WebSocket.OPEN) return;

    const wsUrl = `${WS_BASE_URL}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🚀 Conexión Multijugador establecida');
      set({ isConnected: true, socket: ws, reconnectAttempts: 0 });

      const currentSession = useSessionStore.getState();
      const user = sanitizeUser(currentSession.user);

      ws.send(JSON.stringify({
        type: 'IDENTIFY',
        user: user,
        token: currentSession.token,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        get().handleMessage(data);
      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
      }
    };

    ws.onclose = () => {
      console.warn('⚠️ Conexión Multijugador cerrada');
      set({ isConnected: false, socket: null, room: null });

      if (reconnectAttempts < maxReconnectAttempts) {
        const nextAttempt = reconnectAttempts + 1;
        set({ reconnectAttempts: nextAttempt });
        setTimeout(() => get().connect(), 2000 * nextAttempt);
      }
    };

    ws.onerror = () => {
      set({ error: 'No se pudo establecer conexión multijugador.' });
    };
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) socket.close();
    set({
      socket: null,
      isConnected: false,
      room: null,
      invitations: [],
      challengeRequests: [],
      reconnectAttempts: 5
    });
  },

  handleMessage: (data: any) => {
    const sessionStore = useSessionStore.getState();
    const currentUser = sanitizeUser(sessionStore.user);

    switch (data.type) {
      case 'GLOBAL_ROOMS_UPDATE':
        set({ availableRooms: (data.rooms || []).map(sanitizeRoom) });
        break;

      case 'JOIN_SUCCESS':
        set({ room: sanitizeRoom(data.room) });
        break;

      case 'ROOM_UPDATE':
        if (data.room) {
          const sRoom = sanitizeRoom(data.room);
          const subRole = sRoom?.gameConfig?.subRoles?.[currentUser || ''] || null;
          set({ room: sRoom, subRole });
        }
        break;

      case 'MATCH_STARTING':
        const startingRoom = sanitizeRoom(data.room);
        set({
          roundScores: {},
          remoteCursors: {},
          partnerText: '',
          partnerEmojis: [],
          lastMessage: null,
          room: startingRoom,
          subRole: startingRoom?.gameConfig?.subRoles?.[currentUser || ''] || null,
          timeLeft: 60,
          raceFuel: 100,
          raceProgress: 0,
          partnerProgress: 0
        });
        get().stopFuelTimer();
        if (startingRoom?.gameConfig?.mode === 'RACE') {
          get().startFuelTimer();
        }
        break;

      case 'GAME_ACTION':
        const action = data.action;
        if (action.type === 'MOUSE_MOVE') {
          set(state => ({
            remoteCursors: {
              ...state.remoteCursors,
              [data.from]: { x: action.x, y: action.y, isFiring: !!action.isFiring }
            }
          }));
        } else if (action.type === 'PARTNER_TYPING') {
          set({ partnerText: action.text });
        } else if (action.type === 'PARTNER_EMOJI') {
          set(state => ({ partnerEmojis: [...state.partnerEmojis, action.emoji] }));
        } else if (action.type === 'TIME_SYNC') {
          set({ timeLeft: action.timeLeft });
        } else if (action.type === 'RACE_PROGRESS_UPDATE') {
          if (data.from !== currentUser) {
            set({ partnerProgress: action.progress });
          }
        }
        set({ lastMessage: data });
        break;

      case 'MATCH_FINISHED':
        set({ returnedPlayers: [], room: sanitizeRoom(data.room), lastMessage: data });
        get().stopFuelTimer();
        break;

      case 'ERROR':
        set({ error: data.message });
        break;

      default:
        break;
    }
  },

  updateGameConfig: (config) => {
    const { isConnected, room, socket } = get();
    if (!isConnected || !room || !socket) return;
    socket.send(JSON.stringify({ type: 'UPDATE_GAME_CONFIG', roomId: room.id, config }));
  },

  startMatch: () => {
    const { isConnected, room, socket } = get();
    if (!isConnected || !room || !socket) return;
    socket.send(JSON.stringify({ type: 'START_MATCH', roomId: room.id }));
  },

  setRoomStatus: (status) => {
    const { isConnected, room, socket } = get();
    if (!isConnected || !room || !socket) return;
    socket.send(JSON.stringify({ type: 'SET_ROOM_STATUS', roomId: room.id, status }));
  },

  submitRoundResult: () => {
    const { isConnected, room, socket } = get();
    const user = sanitizeUser(useSessionStore.getState().user);
    if (!isConnected || !room || !socket) return;
    socket.send(JSON.stringify({ type: 'SUBMIT_ROUND_RESULT', roomId: room.id, user }));
  },

  returnToLobby: () => {
    const { isConnected, room, socket } = get();
    const user = sanitizeUser(useSessionStore.getState().user);
    if (!isConnected || !room || !socket) return;
    socket.send(JSON.stringify({ type: 'PLAYER_RETURN_TO_LOBBY', roomId: room.id, user }));
  },

  sendGameAction: (action) => {
    const { isConnected, room, socket } = get();
    const user = sanitizeUser(useSessionStore.getState().user);
    if (!isConnected || !room || !socket) return;

    socket.send(JSON.stringify({
      type: 'GAME_ACTION',
      roomId: room.id,
      user: user,
      action,
    }));
  },

  sendEmojiClue: (emoji) => {
    get().sendGameAction({ type: 'EMOJI_CHAT', emoji });
  },

  sendChallenge: async (friendName) => {
    const { isConnected, socket } = get();
    const user = sanitizeUser(useSessionStore.getState().user);
    if (!isConnected || !socket || socket.readyState !== WebSocket.OPEN) return false;

    socket.send(JSON.stringify({
      type: 'CHALLENGE',
      from: user,
      to: friendName,
    }));
    return true;
  },

  respondToChallenge: (challengerName, accepted) => {
    const { isConnected, socket } = get();
    const user = sanitizeUser(useSessionStore.getState().user);
    if (!isConnected || !socket) return;

    socket.send(JSON.stringify({
      type: 'CHALLENGE_RESPONSE',
      from: user,
      to: challengerName,
      accepted,
    }));

    set(state => ({
      challengeRequests: state.challengeRequests.filter(r => r.from !== challengerName)
    }));
  },

  createRoom: (userAccount, isPublic = true, maxPlayers = 4, gameConfig = {}) => {
    const { socket } = get();
    const user = sanitizeUser(userAccount);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'CREATE_ROOM',
        user: user,
        isPublic,
        maxPlayers,
        gameConfig,
      }));
    }
  },

  joinRoom: (roomId) => {
    const { isConnected, socket } = get();
    const user = sanitizeUser(useSessionStore.getState().user);
    if (!isConnected || !socket) return;
    socket.send(JSON.stringify({ type: 'JOIN_ROOM', roomId, user: user }));
  },

  inviteFriend: (friendName) => {
    const { isConnected, room, socket } = get();
    const user = sanitizeUser(useSessionStore.getState().user);
    if (!isConnected || !room || !socket) return;
    socket.send(JSON.stringify({
      type: 'INVITE',
      from: user,
      to: friendName,
      roomId: room.id,
    }));
  },

  leaveRoom: () => {
    const { isConnected, room, socket } = get();
    const user = sanitizeUser(useSessionStore.getState().user);
    if (!isConnected || !room || !socket) return;
    socket.send(JSON.stringify({ type: 'LEAVE_ROOM', roomId: room.id, user: user }));
    set({ room: null });
    get().stopFuelTimer();
  },

  updateRaceProgress: (id, isCompleted = false) => {
    const { isConnected, room, socket, completedPlanets } = get();
    const user = sanitizeUser(useSessionStore.getState().user);
    
    set({ raceProgress: id });
    if (isCompleted && !completedPlanets.includes(id)) {
      set(state => ({ completedPlanets: [...state.completedPlanets, id] }));
    }

    if (!isConnected || !room || !socket) return;

    socket.send(JSON.stringify({
      type: 'GAME_ACTION',
      roomId: room.id,
      user: user,
      action: { type: 'RACE_PROGRESS_UPDATE', progress: id, completed: isCompleted },
    }));
  },

  rechargeFuel: (amount = 20) => {
    set(state => ({ raceFuel: Math.min(100, state.raceFuel + amount) }));
  },

  consumeFuel: (amount = 10) => {
    const { raceFuel } = get();
    set({ raceFuel: Math.max(0, raceFuel - amount) });
  },

  startFuelTimer: () => {
    get().stopFuelTimer();
    set({ raceFuel: 100 });
    const interval = setInterval(() => {
      const { raceFuel } = get();
      if (raceFuel > 0) {
        set({ raceFuel: Math.max(0, raceFuel - 0.2) });
      } else {
        get().stopFuelTimer();
      }
    }, 500);
    set({ fuelInterval: interval });
  },

  stopFuelTimer: () => {
    const { fuelInterval } = get();
    if (fuelInterval) {
      clearInterval(fuelInterval);
      set({ fuelInterval: null });
    }
  },
}));