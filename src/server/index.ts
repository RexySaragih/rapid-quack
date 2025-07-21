import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { WordDifficulty } from '../shared/types/word'
import { GameRoom, Player, DuckData, EffectData, ChatMessage } from './types'

declare const process: {
  env: {
    PORT?: string
  }
}

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket.io',
} as any)

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
)

const PORT = process.env.PORT || 3001

// Store rooms in memory
const rooms = new Map<string, GameRoom>()

io.on('connection', socket => {
  console.log('Client connected:', socket.id)

  // Room creation
  socket.on('room:create', (playerData: any) => {
    const roomId = Math.random().toString(36).substring(7)
    const newPlayer: Player = {
      id: socket.id,
      name: {
        playerName: playerData.playerName,
        difficulty: playerData.difficulty,
        gameDuration: playerData.gameDuration
      },
      isReady: false,
      score: 0,
    }

    const room: GameRoom = {
      id: roomId,
      players: [newPlayer],
      difficulty: playerData.difficulty,
      isStarted: false,
      gameDuration: playerData.gameDuration
    }

    rooms.set(roomId, room)
    socket.join(roomId)
    io.to(socket.id).emit('room:created', room)
  })

  // Room joining
  socket.on('room:join', (roomId: string, playerName: string) => {
    const room = rooms.get(roomId)
    if (!room) {
      io.to(socket.id).emit('error', { message: 'Room not found' })
      return
    }

    const newPlayer: Player = {
      id: socket.id,
      name: {
        playerName: playerName,
        difficulty: room.difficulty, // Use room's difficulty
        gameDuration: room.gameDuration || 120 // Use room's game duration
      },
      isReady: false,
      score: 0,
    }

    room.players.push(newPlayer)
    socket.join(roomId)
    io.to(roomId).emit('room:joined', room)
    io.to(roomId).emit('room:updated', room)
  })

  // Room data request
  socket.on('room:request', (roomId: string) => {
    console.log('Room data requested for:', roomId)
    const room = rooms.get(roomId)
    if (!room) {
      io.to(socket.id).emit('error', { message: 'Room not found' })
      return
    }
    io.to(socket.id).emit('room:updated', room)
  })

  // Player ready
  socket.on('player:ready', (roomId: string) => {
    const room = rooms.get(roomId)
    if (!room) return

    const player = room.players.find(p => p.id === socket.id)
    if (!player) return

    player.isReady = true
    player.isGameOver = false // Reset game over state on ready
    player.isRematchReady = false // Reset rematch state on ready

    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady)
    if (allReady && room.players.length >= 2) {
      room.isStarted = true
      // Reset all players' isGameOver and isRematchReady state
      room.players.forEach(p => { p.isGameOver = false; p.isRematchReady = false })
      io.to(roomId).emit('game:start', room)
    } else {
      io.to(roomId).emit('room:updated', room)
    }
  })

  // Player game over
  socket.on('player:gameover', (roomId: string) => {
    const room = rooms.get(roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player) return
    player.isGameOver = true
    // If all players are game over, emit room:gameover
    const allGameOver = room.players.every(p => p.isGameOver)
    if (allGameOver) {
      io.to(roomId).emit('room:gameover', room)
    }
  })

  // Rematch request
  socket.on('rematch:request', (roomId: string) => {
    const room = rooms.get(roomId)
    if (!room) return
    const player = room.players.find(p => p.id === socket.id)
    if (!player) return
    player.isRematchReady = true
    io.to(roomId).emit('rematch:status', room)
    // If all players are ready for rematch, start new game
    const allRematchReady = room.players.length > 1 && room.players.every(p => p.isRematchReady)
    if (allRematchReady) {
      // Reset game state for rematch
      room.players.forEach(p => {
        p.isReady = false
        p.isGameOver = false
        p.isRematchReady = false
        p.score = 0
      })
      room.isStarted = false
      io.to(roomId).emit('rematch:start')
      io.to(roomId).emit('room:updated', room)
    }
  })

  // Score updates
  socket.on('player:score', (roomId: string, score: number) => {
    const room = rooms.get(roomId)
    if (!room) return

    const player = room.players.find(p => p.id === socket.id)
    if (!player) return

    player.score = score
    io.to(roomId).emit('player:score', socket.id, score)
  })

  // Duck spawn synchronization
  socket.on('duck:spawn', (roomId: string, duckData: DuckData) => {
    const room = rooms.get(roomId)
    if (!room || !room.isStarted) return

    // Broadcast duck spawn to other players in the room
    socket.to(roomId).emit('duck:spawn', duckData)
  })

  // Duck hit synchronization
  socket.on('duck:hit', (roomId: string, duckId: string) => {
    const room = rooms.get(roomId)
    if (!room || !room.isStarted) return

    // Broadcast duck hit to other players in the room
    socket.to(roomId).emit('duck:hit', duckId)
  })

  // Effect synchronization
  socket.on('effect:trigger', (roomId: string, effectData: EffectData) => {
    const room = rooms.get(roomId)
    if (!room || !room.isStarted) return

    // Broadcast effect to other players in the room
    socket.to(roomId).emit('effect:trigger', effectData)
  })

  // Chat message handling
  socket.on('chat:message', (roomId: string, messageData: ChatMessage) => {
    console.log('Server received chat message:', { roomId, messageData })
    const room = rooms.get(roomId)
    if (!room) {
      console.log('Room not found for chat message:', roomId)
      return
    }

    console.log('Broadcasting chat message to room:', roomId)
    // Broadcast chat message to all players in the room
    io.to(roomId).emit('chat:message', messageData)
  })

  // Room leaving
  socket.on('room:leave', (roomId: string) => {
    const room = rooms.get(roomId)
    if (!room) return

    room.players = room.players.filter(p => p.id !== socket.id)
    // Remove game over and rematch state for leaving player
    socket.leave(roomId)

    if (room.players.length === 0) {
      rooms.delete(roomId)
    } else {
      // Notify others of rematch status change
      io.to(roomId).emit('rematch:status', room)
      io.to(roomId).emit('room:updated', room)
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)

    // Find and leave all rooms
    rooms.forEach((room, roomId) => {
      if (room.players.some(p => p.id === socket.id)) {
        room.players = room.players.filter(p => p.id !== socket.id)
        // Remove game over and rematch state for disconnected player
        if (room.players.length === 0) {
          rooms.delete(roomId)
        } else {
          io.to(roomId).emit('rematch:status', room)
          io.to(roomId).emit('room:updated', room)
        }
      }
    })
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
