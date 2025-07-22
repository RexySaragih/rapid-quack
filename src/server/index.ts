import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { WordDifficulty } from '../shared/types/word'
import { GameRoom, Player, DuckData, EffectData, ChatMessage } from './types'
import { redisService } from './redis'
import { SocketManager } from './socketManager'

declare const process: {
  env: {
    PORT?: string
    REDIS_URL?: string
  }
  exit: (code?: number) => never
  on: (event: string, listener: (...args: any[]) => void) => void
  uptime: () => number
  memoryUsage: () => {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    arrayBuffers?: number
  }
  cpuUsage: (previousValue?: { user: number; system: number }) => {
    user: number
    system: number
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

// Initialize Redis connection
async function initializeRedis() {
  try {
    await redisService.connect()
    console.log('✅ Redis connected successfully')
    console.log('🚀 Performance features enabled:')
    console.log('   - Data persistence across server restarts')
    console.log('   - Real-time leaderboards')
    console.log('   - Rate limiting and abuse prevention')
    console.log('   - Chat message history')
    console.log('   - Game statistics and analytics')
    console.log('   - Optimized room management')
    console.log('   - Session recovery and caching')
  } catch (error) {
    console.log('⚠️  Redis connection failed, using in-memory storage')
    console.log('   - Rooms will be lost on server restart')
    console.log('   - No leaderboards or analytics')
    console.log('   - No rate limiting')
    console.log('   - No chat history')
    console.log('')
    console.log('💡 To enable Redis features:')
    console.log('   - Install Redis: brew install redis')
    console.log('   - Start Redis: brew services start redis')
    console.log('   - Or download from: https://redis.io/download')
  }
}

// Initialize socket manager
let socketManager: SocketManager

// Health check endpoint with enhanced monitoring
app.get('/health', async (req, res) => {
  const redisStatus = redisService.isRedisConnected()
  const redisPing = redisStatus ? await redisService.ping() : 'disconnected'

  res.json({
    status: 'ok',
    redis: {
      connected: redisStatus,
      ping: redisPing,
    },
    activeConnections: io.engine.clientsCount,
    activeRooms: redisStatus
      ? (await redisService.getAllRooms()).length
      : socketManager?.getActiveRooms().size || 0,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  })
})

// Enhanced leaderboard endpoint
app.get('/leaderboard', async (req, res) => {
  try {
    if (redisService.isRedisConnected()) {
      const topPlayers = await redisService.getTopPlayers(10)
      res.json({
        leaderboard: topPlayers,
        timestamp: Date.now(),
      })
    } else {
      res.json({
        leaderboard: [],
        message: 'Redis not available',
        timestamp: Date.now(),
      })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

// Enhanced game statistics endpoint
app.get('/stats', async (req, res) => {
  try {
    if (redisService.isRedisConnected()) {
      const stats = await socketManager?.getRedisStats()
      res.json({
        ...stats,
        timestamp: Date.now(),
        serverUptime: process.uptime(),
      })
    } else {
      res.json({
        message: 'Redis not available',
        timestamp: Date.now(),
        serverUptime: process.uptime(),
      })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

// New endpoint: Room information
app.get('/rooms', async (req, res) => {
  try {
    if (redisService.isRedisConnected()) {
      const roomIds = await redisService.getAllRooms()
      const rooms = []

      for (const roomId of roomIds) {
        const room = await redisService.getRoom(roomId)
        if (room) {
          rooms.push({
            id: room.id,
            playerCount: room.players.length,
            isStarted: room.isStarted,
            difficulty: room.difficulty,
            gameDuration: room.gameDuration,
          })
        }
      }

      res.json({ rooms, count: rooms.length })
    } else {
      const fallbackRooms = socketManager?.getActiveRooms()
      const rooms = Array.from(fallbackRooms?.values() || []).map(room => ({
        id: room.id,
        playerCount: room.players.length,
        isStarted: room.isStarted,
        difficulty: room.difficulty,
        gameDuration: room.gameDuration,
      }))

      res.json({ rooms, count: rooms.length })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' })
  }
})

// New endpoint: Player session recovery
app.get('/session/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params

    if (redisService.isRedisConnected()) {
      const session = await redisService.getPlayerSession(playerId)
      if (session) {
        res.json({ session, found: true })
      } else {
        res.json({ session: null, found: false })
      }
    } else {
      res.json({ session: null, found: false, message: 'Redis not available' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' })
  }
})

// New endpoint: Chat history for a room
app.get('/chat/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params
    const limit = parseInt(req.query.limit as string) || 50

    if (redisService.isRedisConnected()) {
      const history = await redisService.getChatHistory(roomId, limit)
      res.json({ history, count: history.length })
    } else {
      res.json({ history: [], count: 0, message: 'Redis not available' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' })
  }
})

// Performance monitoring endpoint
app.get('/performance', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    res.json({
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      cpu: cpuUsage,
      uptime: process.uptime(),
      activeConnections: io.engine.clientsCount,
      redisConnected: redisService.isRedisConnected(),
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance data' })
  }
})

// Initialize Redis and start server
initializeRedis()
  .then(() => {
    // Initialize socket manager after Redis
    socketManager = new SocketManager(io)

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🏆 Leaderboard: http://localhost:${PORT}/leaderboard`)
      console.log(`📈 Statistics: http://localhost:${PORT}/stats`)
      console.log(`🏠 Rooms: http://localhost:${PORT}/rooms`)
      console.log(`💬 Chat History: http://localhost:${PORT}/chat/:roomId`)
      console.log(`⚡ Performance: http://localhost:${PORT}/performance`)
    })
  })
  .catch(error => {
    console.error('Failed to initialize server:', error)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...')
  await redisService.disconnect()
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
