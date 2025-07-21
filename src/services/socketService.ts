import { WordDifficulty } from '../shared/types/word'
import socketIOClient from 'socket.io-client'

export interface GameRoom {
  id: string
  players: Player[]
  difficulty: WordDifficulty
  isStarted: boolean
  gameDuration: number
  rematchCount?: number // Add rematch count to room state
}

export interface Player {
  id: string
  name: {
    playerName: string
    difficulty?: string
    gameDuration?: number
  }
  isReady: boolean
  score: number
  wantsRematch?: boolean // Track if player wants rematch
}

interface DuckData {
  id: string
  x: number
  y: number
  word: string
  difficulty: WordDifficulty
  points: number
  speed: number
}

interface EffectData {
  type: 'hit' | 'combo' | 'score'
  x: number
  y: number
  color?: number
  value?: number
  comboCount?: number
}

interface ChatMessage {
  playerName: string
  message: string
  timestamp: number
}

export class SocketService {
  private static instance: SocketService
  private socket: ReturnType<typeof socketIOClient> | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private isReconnecting: boolean = false
  private errorCallback: ((error: string) => void) | null = null
  private connectionStateCallback: ((isConnected: boolean) => void) | null =
    null

  private roomCreatedCallback: ((room: GameRoom) => void) | null = null
  private roomJoinedCallback: ((room: GameRoom) => void) | null = null
  private roomUpdatedCallback: ((room: GameRoom) => void) | null = null
  private gameStartCallback: ((room: GameRoom) => void) | null = null
  private duckSpawnCallback: ((duckData: DuckData) => void) | null = null
  private duckHitCallback: ((duckId: string) => void) | null = null
  private opponentScoreCallback: ((score: number) => void) | null = null
  private effectCallback: ((effectData: EffectData) => void) | null = null
  private chatMessageCallback: ((messageData: ChatMessage) => void) | null = null

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  public isConnected(): boolean {
    return this.socket?.connected || false
  }

  public connect(): void {
    if (this.socket?.connected) return

    try {
      this.socket = socketIOClient('http://localhost:3001', {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: false, // We'll handle reconnection manually
        path: '/socket.io',
      })

      this.setupEventListeners()
      this.setupErrorHandling()
    } catch (error) {
      this.handleError('Failed to connect to server')
    }
  }

  private setupErrorHandling(): void {
    if (!this.socket) return

    this.socket.on('connect_error', () => {
      this.handleError('Connection error occurred')
      this.attemptReconnect()
    })

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0
      this.isReconnecting = false
      if (this.connectionStateCallback) {
        this.connectionStateCallback(true)
      }
    })

    this.socket.on('disconnect', () => {
      if (this.connectionStateCallback) {
        this.connectionStateCallback(false)
      }
      this.attemptReconnect()
    })

    this.socket.on('error', (error: Error) => {
      this.handleError(`Socket error: ${error.message}`)
    })
  }

  private async attemptReconnect(): Promise<void> {
    if (this.isReconnecting || this.socket?.connected) return

    this.isReconnecting = true
    while (this.reconnectAttempts < this.maxReconnectAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay))
        this.reconnectAttempts++

        if (this.socket) {
          this.socket.connect()
          return
        } else {
          this.connect()
          return
        }
      } catch (error) {
        this.handleError(
          `Reconnection attempt ${this.reconnectAttempts} failed`
        )
      }
    }

    this.handleError('Failed to reconnect after maximum attempts')
    this.isReconnecting = false
  }

  private handleError(message: string): void {
    console.error(message)
    if (this.errorCallback) {
      this.errorCallback(message)
    }
  }

  // Event handling setup
  private setupEventListeners(): void {
    if (!this.socket) return

    this.socket.on('room:created', (roomData: any) => {
      console.log('Room created event received:', roomData)
      // Make sure we're passing a proper GameRoom object
      const room: GameRoom = {
        id: roomData.id || '',
        players: Array.isArray(roomData.players) ? roomData.players : [],
        difficulty: roomData.difficulty || WordDifficulty.NORMAL,
        isStarted: !!roomData.isStarted,
        gameDuration: roomData?.players[0]?.name?.gameDuration || 120,
        rematchCount: roomData.rematchCount
      }
      console.log('Processed room data:', room)
      console.log('roomData.players[0].name.gameDuration', roomData.players[0].name.gameDuration)
      console.log('room', room)
      if (this.roomCreatedCallback) this.roomCreatedCallback(room)
    })

    this.socket.on('room:joined', (roomData: any) => {
      console.log('Room joined event received:', roomData)
      const room: GameRoom = {
        id: roomData.id || '',
        players: Array.isArray(roomData.players) ? roomData.players : [],
        difficulty: roomData.difficulty || WordDifficulty.NORMAL,
        isStarted: !!roomData.isStarted,
        gameDuration: roomData?.players[0]?.name?.gameDuration || 120,
        rematchCount: roomData.rematchCount
      }
      if (this.roomJoinedCallback) this.roomJoinedCallback(room)
    })

    this.socket.on('room:updated', (roomData: any) => {
      console.log('Room updated event received:', roomData)
      const room: GameRoom = {
        id: roomData.id || '',
        players: Array.isArray(roomData.players) ? roomData.players : [],
        difficulty: roomData.difficulty || WordDifficulty.NORMAL,
        isStarted: !!roomData.isStarted,
        gameDuration: roomData?.players[0]?.name?.gameDuration || 120,
        rematchCount: roomData.rematchCount
      }
      if (this.roomUpdatedCallback) this.roomUpdatedCallback(room)
    })

    this.socket.on('game:start', (roomData: any) => {
      console.log('Game start event received:', roomData)
      const room: GameRoom = {
        id: roomData.id || '',
        players: Array.isArray(roomData.players) ? roomData.players : [],
        difficulty: roomData.difficulty || WordDifficulty.NORMAL,
        isStarted: !!roomData.isStarted,
        gameDuration: roomData?.players[0]?.name?.gameDuration || 120,
        rematchCount: roomData.rematchCount
      }
      if (this.gameStartCallback) this.gameStartCallback(room)
    })

    this.socket.on('duck:spawn', (duckData: DuckData) => {
      if (this.duckSpawnCallback) this.duckSpawnCallback(duckData)
    })

    this.socket.on('duck:hit', (duckId: string) => {
      if (this.duckHitCallback) this.duckHitCallback(duckId)
    })

    this.socket.on('player:score', (playerId: string, score: number) => {
      if (this.opponentScoreCallback && playerId !== this.socket?.id) {
        this.opponentScoreCallback(score)
      }
    })

    this.socket.on('effect:trigger', (effectData: EffectData) => {
      if (this.effectCallback) this.effectCallback(effectData)
    })

    this.socket.on('chat:message', (messageData: ChatMessage) => {
      console.log('Received chat message:', messageData)
      console.log('Chat callback exists:', !!this.chatMessageCallback)
      if (this.chatMessageCallback) {
        console.log('Calling chat callback')
        this.chatMessageCallback(messageData)
      } else {
        console.log('Chat callback is null, not calling')
      }
    })

    // Update rematch status listener to include count
    this.socket.on('rematch:status', (room: GameRoom) => {
      if (this.roomUpdatedCallback) this.roomUpdatedCallback(room)
    })

    // Listen for player leave events
    this.socket.on('player:left', (room: GameRoom) => {
      if (this.roomUpdatedCallback) {
        this.roomUpdatedCallback(room)
        // Reset rematch state when a player leaves
        if (room.rematchCount) {
          room.rematchCount = 0
          room.players.forEach(p => p.wantsRematch = false)
        }
      }
    })

    // Listen for rematch count updates
    this.socket.on('rematch:count', (room: GameRoom) => {
      if (this.roomUpdatedCallback) {
        this.roomUpdatedCallback(room)
        // If all players want rematch, trigger rematch start
        const allWantRematch = room.players.every(p => p.wantsRematch)
        if (allWantRematch) {
          this.socket?.emit('rematch:start', room.id)
        }
      }
    })
  }

  // Room management methods
  public createRoom(
    playerName: string, 
    difficulty: WordDifficulty,
    gameDuration: number
  ): void {
    this.socket?.emit('room:create', {playerName, difficulty, gameDuration})
  }

  public joinRoom(roomId: string, playerName: string): void {
    this.socket?.emit('room:join', roomId, playerName)
  }

  public leaveRoom(roomId: string): void {
    this.socket?.emit('room:leave', roomId)
  }

  public setReady(roomId: string): void {
    this.socket?.emit('player:ready', roomId)
  }

  public requestRoomData(roomId: string): void {
    this.socket?.emit('room:request', roomId)
  }

  // Game synchronization methods
  public updateScore(roomId: string, score: number): void {
    this.socket?.emit('player:score', roomId, score)
  }

  public emitDuckSpawn(roomId: string, duckData: DuckData): void {
    this.socket?.emit('duck:spawn', roomId, duckData)
  }

  public emitDuckHit(roomId: string, duckId: string): void {
    this.socket?.emit('duck:hit', roomId, duckId)
  }

  // Effect synchronization
  public onEffect(callback: (effectData: EffectData) => void): void {
    this.effectCallback = callback
  }

  public emitEffect(roomId: string, effectData: EffectData): void {
    this.socket?.emit('effect:trigger', roomId, effectData)
  }

  // Game over notification for multiplayer
  public emitPlayerGameOver(roomId: string): void {
    this.socket?.emit('player:gameover', roomId)
  }

  // Room-wide game over event
  public onRoomGameOver(callback: (room: GameRoom) => void): void {
    this.socket?.on('room:gameover', callback)
  }

  // Rematch events
  public requestRematch(roomId: string): void {
    if (!this.socket) return
    this.socket.emit('rematch:request', roomId, this.socket.id)
  }
  public onRematchStatus(callback: (room: GameRoom) => void): void {
    this.socket?.on('rematch:status', callback)
  }
  public onRematchStart(callback: () => void): void {
    this.socket?.on('rematch:start', callback)
  }
  public offRematchStatus(): void {
    this.socket?.off('rematch:status')
  }
  public offRematchStart(): void {
    this.socket?.off('rematch:start')
  }

  // Get current rematch count for a room
  public getRematchCount(room: GameRoom): number {
    return room.players.filter(p => p.wantsRematch).length
  }

  // Check if all players in room want rematch
  public allPlayersWantRematch(room: GameRoom): boolean {
    return room.players.every(p => p.wantsRematch)
  }

  // Check if specific player wants rematch
  public playerWantsRematch(room: GameRoom, playerId: string): boolean {
    const player = room.players.find(p => p.id === playerId)
    return player?.wantsRematch || false
  }

  // Event listeners
  public onRoomCreated(callback: (room: GameRoom) => void): void {
    this.roomCreatedCallback = callback
  }

  public onRoomJoined(callback: (room: GameRoom) => void): void {
    this.roomJoinedCallback = callback
  }

  public onRoomUpdated(callback: (room: GameRoom) => void): void {
    this.roomUpdatedCallback = callback
  }

  public onGameStart(callback: (room: GameRoom) => void): void {
    this.gameStartCallback = callback
  }

  public onDuckSpawn(callback: (duckData: DuckData) => void): void {
    this.duckSpawnCallback = callback
  }

  public onDuckHit(callback: (duckId: string) => void): void {
    this.duckHitCallback = callback
  }

  public onOpponentScore(callback: (score: number) => void): void {
    this.opponentScoreCallback = callback
  }

  public onChatMessage(callback: (messageData: ChatMessage) => void): void {
    console.log('Setting up chat message listener')
    this.chatMessageCallback = callback
    console.log('Chat callback set:', !!this.chatMessageCallback)
  }

  public offChatMessage(): void {
    console.log('Removing chat message listener')
    this.chatMessageCallback = null
    console.log('Chat callback cleared:', !!this.chatMessageCallback)
    // Don't remove the socket listener, just clear the callback
    // this.socket?.off('chat:message')
  }

  public sendChatMessage(roomId: string, messageData: ChatMessage): void {
    console.log('Sending chat message via socket:', { roomId, messageData })
    if (!this.socket) {
      console.error('Socket not connected when trying to send chat message')
      return
    }
    this.socket.emit('chat:message', roomId, messageData)
  }

  // Error and connection state handlers
  public onError(callback: (error: string) => void): void {
    this.errorCallback = callback
  }

  public onConnectionStateChange(
    callback: (isConnected: boolean) => void
  ): void {
    this.connectionStateCallback = callback
  }

  // Cleanup methods
  public offDuckSpawn(): void {
    this.duckSpawnCallback = null
  }

  public offDuckHit(): void {
    this.duckHitCallback = null
  }

  public offOpponentScore(): void {
    this.opponentScoreCallback = null
  }

  public offRoomUpdated(): void {
    this.roomUpdatedCallback = null
  }

  public offGameStart(): void {
    this.gameStartCallback = null
  }

  public offRoomCreated(): void {
    this.roomCreatedCallback = null
  }

  public offRoomJoined(): void {
    this.roomJoinedCallback = null
  }

  public offEffect(): void {
    this.effectCallback = null
  }

  public offError(): void {
    this.errorCallback = null
  }

  public offConnectionStateChange(): void {
    this.connectionStateCallback = null
  }

  public offRoomGameOver(): void {
    this.socket?.off('room:gameover')
  }

  // Utility methods
  public getSocketId(): string | undefined {
    return this.socket?.id
  }

  public disconnect(): void {
    if (!this.socket) return
    this.socket.disconnect()
    this.socket = null
    this.reconnectAttempts = 0
    this.isReconnecting = false
  }
}

export const socketService = SocketService.getInstance()
