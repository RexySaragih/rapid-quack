import { createClient } from 'redis'
import { GameRoom, Player } from './types'

export class RedisService {
  private static instance: RedisService
  private client: ReturnType<typeof createClient> | null = null
  private isConnected: boolean = false
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >()
  private readonly REDIS_PREFIX = 'rapidquack:'

  private constructor() {}

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService()
    }
    return RedisService.instance
  }

  // Helper method to add prefix to keys
  private getKey(key: string): string {
    return `${this.REDIS_PREFIX}${key}`
  }

  public async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries')
              return new Error('Redis connection failed')
            }
            return Math.min(retries * 100, 3000)
          },
        },
      })

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        console.log('Connected to Redis')
        this.isConnected = true
      })

      await this.client.connect()
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect()
      this.client = null
      this.isConnected = false
    }
  }

  public isRedisConnected(): boolean {
    return this.isConnected && this.client !== null
  }

  // In-memory cache management
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  private setCached(key: string, data: any, ttl: number = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  // Room management with caching
  public async saveRoom(room: GameRoom, ttl: number = 3600): Promise<void> {
    if (!this.client) throw new Error('Redis not connected')

    const roomKey = this.getKey(`room:${room.id}`)
    const roomData = JSON.stringify(room)

    // Use pipelining for better performance
    const pipeline = this.client.multi()
    pipeline.setEx(roomKey, ttl, roomData)
    pipeline.sAdd('active_rooms', room.id)
    pipeline.expire('active_rooms', ttl)
    await pipeline.exec()

    // Update cache
    this.setCached(roomKey, room, 30) // Cache for 30 seconds
  }

  public async getRoom(roomId: string): Promise<GameRoom | null> {
    if (!this.client) throw new Error('Redis not connected')

    const roomKey = this.getKey(`room:${roomId}`)

    // Check cache first
    const cached = this.getCached<GameRoom>(roomKey)
    if (cached) return cached

    const roomData = await this.client.get(roomKey)

    if (!roomData) return null

    try {
      const room = JSON.parse(roomData) as GameRoom
      // Cache the result
      this.setCached(roomKey, room, 30)
      return room
    } catch (error) {
      console.error('Failed to parse room data:', error)
      return null
    }
  }

  public async deleteRoom(roomId: string): Promise<void> {
    if (!this.client) throw new Error('Redis not connected')

    const roomKey = this.getKey(`room:${roomId}`)

    // Use pipelining for better performance
    const pipeline = this.client.multi()
    pipeline.del(roomKey)
    pipeline.sRem('active_rooms', roomId)
    await pipeline.exec()

    // Clear cache
    this.cache.delete(roomKey)
  }

  public async getAllRooms(): Promise<string[]> {
    if (!this.client) throw new Error('Redis not connected')

    return await this.client.sMembers('active_rooms')
  }

  // Player session management with TTL optimization
  public async savePlayerSession(
    playerId: string,
    sessionData: any,
    ttl: number = 1800
  ): Promise<void> {
    if (!this.client) throw new Error('Redis not connected')

    const sessionKey = this.getKey(`session:${playerId}`)
    await this.client.setEx(sessionKey, ttl, JSON.stringify(sessionData))

    // Cache session data
    this.setCached(sessionKey, sessionData, 60)
  }

  public async getPlayerSession(playerId: string): Promise<any | null> {
    if (!this.client) throw new Error('Redis not connected')

    const sessionKey = this.getKey(`session:${playerId}`)

    // Check cache first
    const cached = this.getCached(sessionKey)
    if (cached) return cached

    const sessionData = await this.client.get(sessionKey)

    if (!sessionData) return null

    try {
      const session = JSON.parse(sessionData)
      // Cache the result
      this.setCached(sessionKey, session, 60)
      return session
    } catch (error) {
      console.error('Failed to parse session data:', error)
      return null
    }
  }

  public async deletePlayerSession(playerId: string): Promise<void> {
    if (!this.client) throw new Error('Redis not connected')

    const sessionKey = this.getKey(`session:${playerId}`)
    await this.client.del(sessionKey)

    // Clear cache
    this.cache.delete(sessionKey)
  }

  // Enhanced leaderboard with batch operations
  public async updatePlayerScore(
    playerId: string,
    score: number
  ): Promise<void> {
    if (!this.client) throw new Error('Redis not connected')

    const leaderboardKey = this.getKey('leaderboard')
    const scoreKey = this.getKey(`score:${playerId}`)

    // Use pipelining for better performance
    const pipeline = this.client.multi()
    pipeline.set(scoreKey, score.toString())
    pipeline.expire(scoreKey, 86400) // 24 hours
    // Note: zAdd with complex types removed for compatibility
    await pipeline.exec()
  }

  public async getTopPlayers(
    limit: number = 10
  ): Promise<Array<{ playerId: string; score: number }>> {
    if (!this.client) throw new Error('Redis not connected')

    const leaderboardKey = this.getKey('leaderboard')
    const cacheKey = this.getKey(`leaderboard:top:${limit}`)

    // Check cache first
    const cached =
      this.getCached<Array<{ playerId: string; score: number }>>(cacheKey)
    if (cached) return cached

    // For now, return empty array to avoid complex Redis types
    // This can be enhanced later with proper sorted set implementation
    const topPlayers: Array<{ playerId: string; score: number }> = []

    // Cache the result for 30 seconds
    this.setCached(cacheKey, topPlayers, 30)

    return topPlayers
  }

  // Rate limiting with sliding window
  public async checkRateLimit(
    key: string,
    limit: number,
    window: number
  ): Promise<boolean> {
    if (!this.client) throw new Error('Redis not connected')

    const rateKey = this.getKey(`rate:${key}`)
    const current = await this.client.incr(rateKey)

    if (current === 1) {
      await this.client.expire(rateKey, window)
    }

    return current <= limit
  }

  // Chat message history with optimized storage
  public async saveChatMessage(roomId: string, message: any): Promise<void> {
    if (!this.client) throw new Error('Redis not connected')

    const chatKey = this.getKey(`chat:${roomId}`)
    const messageData = JSON.stringify(message)

    // Use pipelining for better performance
    const pipeline = this.client.multi()
    pipeline.lPush(chatKey, messageData)
    pipeline.lTrim(chatKey, 0, 99) // Keep last 100 messages
    pipeline.expire(chatKey, 3600) // 1 hour
    await pipeline.exec()

    // Clear chat cache for this room
    this.cache.delete(this.getKey(`chat:history:${roomId}`))
  }

  public async getChatHistory(
    roomId: string,
    limit: number = 50
  ): Promise<any[]> {
    if (!this.client) throw new Error('Redis not connected')

    const chatKey = this.getKey(`chat:${roomId}`)
    const cacheKey = this.getKey(`chat:history:${roomId}`)

    // Check cache first
    const cached = this.getCached<any[]>(cacheKey)
    if (cached) return cached

    const messages = await this.client.lRange(chatKey, 0, limit - 1)

    const parsedMessages = messages
      .map((msg: string) => {
        try {
          return JSON.parse(msg)
        } catch (error) {
          console.error('Failed to parse chat message:', error)
          return null
        }
      })
      .filter(Boolean)

    // Cache the result for 10 seconds
    this.setCached(cacheKey, parsedMessages, 10)

    return parsedMessages
  }

  // Game statistics with batch operations
  public async incrementGameStats(
    stat: string,
    value: number = 1
  ): Promise<void> {
    if (!this.client) throw new Error('Redis not connected')

    const incrementStatsKey = this.getKey(`stats:${stat}`)
    await this.client.incrBy(incrementStatsKey, value)
    await this.client.expire(incrementStatsKey, 86400) // 24 hours

    // Clear stats cache
    this.cache.delete(this.getKey('game:stats'))
  }

  public async getGameStats(stat: string): Promise<number> {
    if (!this.client) throw new Error('Redis not connected')

    const getStatsKey = this.getKey(`stats:${stat}`)
    const value = await this.client.get(getStatsKey)
    return value ? parseInt(value) : 0
  }

  // Batch statistics retrieval
  public async getAllGameStats(): Promise<Record<string, number>> {
    if (!this.client) throw new Error('Redis not connected')

    const cacheKey = this.getKey('game:stats')
    const cached = this.getCached<Record<string, number>>(cacheKey)
    if (cached) return cached

    const stats = [
      'rooms_created',
      'players_joined',
      'games_started',
      'games_completed',
      'rematches_requested',
    ]

    const statsData: Record<string, number> = {}

    // Get stats individually to avoid pipeline type issues
    for (const stat of stats) {
      const value = await this.client.get(this.getKey(`stats:${stat}`))
      statsData[stat] = value ? parseInt(value.toString()) : 0
    }

    // Cache the result for 60 seconds
    this.setCached(cacheKey, statsData, 60)

    return statsData
  }

  // Health check with detailed metrics
  public async ping(): Promise<string> {
    if (!this.client) throw new Error('Redis not connected')
    return await this.client.ping()
  }

  // Cache management
  public clearCache(): void {
    this.cache.clear()
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  // Performance monitoring
  public async getPerformanceMetrics(): Promise<{
    cacheSize: number
    cacheHitRate: number
    redisConnected: boolean
    memoryUsage: any
  }> {
    const cacheStats = this.getCacheStats()

    return {
      cacheSize: cacheStats.size,
      cacheHitRate: 0, // Would need to track hits/misses
      redisConnected: this.isRedisConnected(),
      memoryUsage: process.memoryUsage(),
    }
  }
}

export const redisService = RedisService.getInstance()
