import { Server, Socket } from 'socket.io'
import { redisService } from './redis'
import { GameRoom, Player, DuckData, EffectData, ChatMessage } from './types'

export class SocketManager {
  private io: Server
  private fallbackRooms = new Map<string, GameRoom>()
  private playerSessions = new Map<
    string,
    { roomId: string; playerName: string }
  >()

  constructor(io: Server) {
    this.io = io
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id)

      // Setup individual socket event handlers
      this.setupRoomHandlers(socket)
      this.setupGameHandlers(socket)
      this.setupChatHandlers(socket)
      this.setupDisconnectHandler(socket)
    })
  }

  private setupRoomHandlers(socket: Socket) {
    // Room creation with Redis optimization
    socket.on('room:create', async (playerData: any) => {
      if (!(await this.checkRateLimit(socket, 'create_room'))) return

      const roomId = this.generateRoomId()
      const newPlayer: Player = {
        id: socket.id,
        name: {
          playerName: playerData.playerName,
          difficulty: playerData.difficulty,
          gameDuration: playerData.gameDuration,
        },
        isReady: false,
        score: 0,
      }

      const room: GameRoom = {
        id: roomId,
        players: [newPlayer],
        difficulty: playerData.difficulty,
        isStarted: false,
        gameDuration: playerData.gameDuration,
      }

      // Save to Redis with optimized TTL
      if (redisService.isRedisConnected()) {
        await redisService.saveRoom(room, 7200) // 2 hours for active rooms
        await redisService.savePlayerSession(socket.id, {
          roomId,
          playerName: playerData.playerName,
          joinedAt: Date.now(),
          difficulty: playerData.difficulty,
          gameDuration: playerData.gameDuration,
        })

        // Track analytics
        await redisService.incrementGameStats('rooms_created')
      } else {
        this.fallbackRooms.set(roomId, room)
      }

      socket.join(roomId)
      socket.emit('room:created', room)

      console.log(`Room created: ${roomId} by ${playerData.playerName}`)
    })

    // Room joining with session recovery
    socket.on('room:join', async (roomId: string, playerName: string) => {
      if (!(await this.checkRateLimit(socket, 'join_room'))) return

      let room: GameRoom | null = null

      if (redisService.isRedisConnected()) {
        room = await redisService.getRoom(roomId)
      } else {
        room = this.fallbackRooms.get(roomId) || null
      }

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      // Check if player is already in room
      const existingPlayer = room.players.find(p => p.id === socket.id)
      if (existingPlayer) {
        socket.emit('room:joined', room)
        return
      }

      const newPlayer: Player = {
        id: socket.id,
        name: {
          playerName: playerName,
          difficulty: room.difficulty,
          gameDuration: room.gameDuration || 120,
        },
        isReady: false,
        score: 0,
      }

      room.players.push(newPlayer)

      // Save updated room
      if (redisService.isRedisConnected()) {
        await redisService.saveRoom(room)
        await redisService.savePlayerSession(socket.id, {
          roomId,
          playerName,
          joinedAt: Date.now(),
        })
        await redisService.incrementGameStats('players_joined')
      } else {
        this.fallbackRooms.set(roomId, room)
      }

      socket.join(roomId)
      this.io.to(roomId).emit('room:joined', room)
      this.io.to(roomId).emit('room:updated', room)

      // Send system message about player joining
      this.sendSystemMessage(roomId, `${playerName} joined the room`)

      console.log(`${playerName} joined room: ${roomId}`)
    })

    // Room data request with caching
    socket.on('room:request', async (roomId: string) => {
      let room: GameRoom | null = null

      if (redisService.isRedisConnected()) {
        room = await redisService.getRoom(roomId)
      } else {
        room = this.fallbackRooms.get(roomId) || null
      }

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      socket.emit('room:updated', room)
    })

    // Player ready with game start optimization
    socket.on('player:ready', async (roomId: string) => {
      let room: GameRoom | null = null

      if (redisService.isRedisConnected()) {
        room = await redisService.getRoom(roomId)
      } else {
        room = this.fallbackRooms.get(roomId) || null
      }

      if (!room) return

      const player = room.players.find(p => p.id === socket.id)
      if (!player) return

      player.isReady = true
      player.isGameOver = false
      player.isRematchReady = false

      // Check if all players are ready
      const allReady = room.players.every(p => p.isReady)
      if (allReady && room.players.length >= 2) {
        room.isStarted = true
        room.players.forEach(p => {
          p.isGameOver = false
          p.isRematchReady = false
        })

        // Save updated room
        if (redisService.isRedisConnected()) {
          await redisService.saveRoom(room)
          await redisService.incrementGameStats('games_started')
        } else {
          this.fallbackRooms.set(roomId, room)
        }

        this.io.to(roomId).emit('game:start', room)
        console.log(`Game started in room: ${roomId}`)
      } else {
        // Save updated room
        if (redisService.isRedisConnected()) {
          await redisService.saveRoom(room)
        } else {
          this.fallbackRooms.set(roomId, room)
        }

        this.io.to(roomId).emit('room:updated', room)
      }
    })
  }

  private setupGameHandlers(socket: Socket) {
    // Score updates with leaderboard integration
    socket.on('player:score', async (roomId: string, score: number) => {
      let room: GameRoom | null = null

      if (redisService.isRedisConnected()) {
        room = await redisService.getRoom(roomId)
      } else {
        room = this.fallbackRooms.get(roomId) || null
      }

      if (!room) return

      const player = room.players.find(p => p.id === socket.id)
      if (!player) return

      player.score = score

      // Update leaderboard if Redis is available
      if (redisService.isRedisConnected()) {
        await redisService.updatePlayerScore(socket.id, score)
      }

      // Save updated room
      if (redisService.isRedisConnected()) {
        await redisService.saveRoom(room)
      } else {
        this.fallbackRooms.set(roomId, room)
      }

      this.io.to(roomId).emit('player:score', socket.id, score)
    })

    // Game over with statistics tracking
    socket.on('player:gameover', async (roomId: string) => {
      let room: GameRoom | null = null

      if (redisService.isRedisConnected()) {
        room = await redisService.getRoom(roomId)
      } else {
        room = this.fallbackRooms.get(roomId) || null
      }

      if (!room) return

      const player = room.players.find(p => p.id === socket.id)
      if (!player) return

      player.isGameOver = true

      // Save updated room
      if (redisService.isRedisConnected()) {
        await redisService.saveRoom(room)
      } else {
        this.fallbackRooms.set(roomId, room)
      }

      // If all players are game over, emit room:gameover
      const allGameOver = room.players.every(p => p.isGameOver)
      if (allGameOver) {
        this.io.to(roomId).emit('room:gameover', room)

        // Track game completion
        if (redisService.isRedisConnected()) {
          await redisService.incrementGameStats('games_completed')
        }
      }
    })

    // Rematch with state management
    socket.on('rematch:request', async (roomId: string) => {
      let room: GameRoom | null = null

      if (redisService.isRedisConnected()) {
        room = await redisService.getRoom(roomId)
      } else {
        room = this.fallbackRooms.get(roomId) || null
      }

      if (!room) return

      const player = room.players.find(p => p.id === socket.id)
      if (!player) return

      player.isRematchReady = true

      // Save updated room
      if (redisService.isRedisConnected()) {
        await redisService.saveRoom(room)
      } else {
        this.fallbackRooms.set(roomId, room)
      }

      this.io.to(roomId).emit('rematch:status', room)

      // If all players are ready for rematch, start new game
      const allRematchReady =
        room.players.length > 1 && room.players.every(p => p.isRematchReady)
      if (allRematchReady) {
        // Reset game state for rematch
        room.players.forEach(p => {
          p.isReady = false
          p.isGameOver = false
          p.isRematchReady = false
          p.score = 0
        })
        room.isStarted = false

        // Save updated room
        if (redisService.isRedisConnected()) {
          await redisService.saveRoom(room)
          await redisService.incrementGameStats('rematches_requested')
        } else {
          this.fallbackRooms.set(roomId, room)
        }

        this.io.to(roomId).emit('rematch:start')
        this.io.to(roomId).emit('room:updated', room)
      }
    })

    // Game synchronization with Redis caching
    socket.on('duck:spawn', async (roomId: string, duckData: DuckData) => {
      let room: GameRoom | null = null

      if (redisService.isRedisConnected()) {
        room = await redisService.getRoom(roomId)
      } else {
        room = this.fallbackRooms.get(roomId) || null
      }

      if (!room || !room.isStarted) return

      // Broadcast duck spawn to other players in the room
      socket.to(roomId).emit('duck:spawn', duckData)
    })

    socket.on('duck:hit', async (roomId: string, duckId: string) => {
      let room: GameRoom | null = null

      if (redisService.isRedisConnected()) {
        room = await redisService.getRoom(roomId)
      } else {
        room = this.fallbackRooms.get(roomId) || null
      }

      if (!room || !room.isStarted) return

      // Broadcast duck hit to other players in the room
      socket.to(roomId).emit('duck:hit', duckId)
    })

    socket.on(
      'effect:trigger',
      async (roomId: string, effectData: EffectData) => {
        let room: GameRoom | null = null

        if (redisService.isRedisConnected()) {
          room = await redisService.getRoom(roomId)
        } else {
          room = this.fallbackRooms.get(roomId) || null
        }

        if (!room || !room.isStarted) return

        // Broadcast effect to other players in the room
        socket.to(roomId).emit('effect:trigger', effectData)
      }
    )
  }

  private setupChatHandlers(socket: Socket) {
    // Chat with Redis persistence and history
    socket.on(
      'chat:message',
      async (roomId: string, messageData: ChatMessage) => {
        let room: GameRoom | null = null

        if (redisService.isRedisConnected()) {
          room = await redisService.getRoom(roomId)
          // Save chat message to Redis for history
          await redisService.saveChatMessage(roomId, messageData)
        } else {
          room = this.fallbackRooms.get(roomId) || null
        }

        if (!room) {
          console.log('Room not found for chat message:', roomId)
          return
        }

        // Ensure timestamp is included
        const enhancedMessageData = {
          ...messageData,
          timestamp: messageData.timestamp || Date.now(),
        }

        // Broadcast chat message to all players in the room
        this.io.to(roomId).emit('chat:message', enhancedMessageData)
      }
    )

    // Chat history request
    socket.on('chat:history', async (roomId: string) => {
      if (redisService.isRedisConnected()) {
        const history = await redisService.getChatHistory(roomId, 50)
        socket.emit('chat:history', history)
      } else {
        socket.emit('chat:history', [])
      }
    })
  }

  // Helper method to send system messages
  private sendSystemMessage(roomId: string, message: string) {
    const systemMessage: ChatMessage = {
      playerName: 'System',
      message,
      timestamp: Date.now(),
    }

    // Save system message to Redis if available
    if (redisService.isRedisConnected()) {
      redisService.saveChatMessage(roomId, systemMessage).catch(console.error)
    }

    // Broadcast to all players in the room
    this.io.to(roomId).emit('chat:message', systemMessage)
  }

  private setupDisconnectHandler(socket: Socket) {
    // Handle disconnection with cleanup
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id)

      // Find and leave all rooms
      const roomsToUpdate: string[] = []

      if (redisService.isRedisConnected()) {
        const allRoomIds = await redisService.getAllRooms()
        for (const roomId of allRoomIds) {
          const room = await redisService.getRoom(roomId)
          if (room && room.players.some(p => p.id === socket.id)) {
            roomsToUpdate.push(roomId)
          }
        }
      } else {
        this.fallbackRooms.forEach((room, roomId) => {
          if (room.players.some(p => p.id === socket.id)) {
            roomsToUpdate.push(roomId)
          }
        })
      }

      for (const roomId of roomsToUpdate) {
        let room: GameRoom | null = null

        if (redisService.isRedisConnected()) {
          room = await redisService.getRoom(roomId)
        } else {
          room = this.fallbackRooms.get(roomId) || null
        }

        if (!room) continue

        // Get player name before removing them
        const leavingPlayer = room.players.find(p => p.id === socket.id)
        const playerName = leavingPlayer?.name?.playerName || 'Unknown Player'

        room.players = room.players.filter(p => p.id !== socket.id)

        if (room.players.length === 0) {
          // Delete room if empty
          if (redisService.isRedisConnected()) {
            await redisService.deleteRoom(roomId)
          } else {
            this.fallbackRooms.delete(roomId)
          }
        } else {
          // Save updated room
          if (redisService.isRedisConnected()) {
            await redisService.saveRoom(room)
          } else {
            this.fallbackRooms.set(roomId, room)
          }

          // Send system message about player leaving
          this.sendSystemMessage(roomId, `${playerName} left the room`)

          this.io.to(roomId).emit('rematch:status', room)
          this.io.to(roomId).emit('room:updated', room)
        }
      }

      // Clean up player session
      if (redisService.isRedisConnected()) {
        await redisService.deletePlayerSession(socket.id)
      }
    })
  }

  private async checkRateLimit(
    socket: Socket,
    action: string
  ): Promise<boolean> {
    if (redisService.isRedisConnected()) {
      const isAllowed = await redisService.checkRateLimit(
        `${socket.id}:${action}`,
        100,
        60
      )
      if (!isAllowed) {
        socket.emit('error', { message: 'Rate limit exceeded' })
        return false
      }
    }
    return true
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(7)
  }

  // Public methods for external access
  public getActiveRooms(): Map<string, GameRoom> {
    return this.fallbackRooms
  }

  public async getRedisStats() {
    if (redisService.isRedisConnected()) {
      return {
        roomsCreated: await redisService.getGameStats('rooms_created'),
        playersJoined: await redisService.getGameStats('players_joined'),
        gamesStarted: await redisService.getGameStats('games_started'),
        gamesCompleted: await redisService.getGameStats('games_completed'),
        rematchesRequested: await redisService.getGameStats(
          'rematches_requested'
        ),
      }
    }
    return null
  }
}
