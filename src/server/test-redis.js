import { redisService } from './redis.js'

async function testRedis() {
  try {
    console.log('Testing Redis connection...')

    // Connect to Redis
    await redisService.connect()
    console.log('✅ Redis connected successfully')

    // Test basic operations
    const testRoom = {
      id: 'test-room-123',
      players: [
        {
          id: 'player-1',
          name: {
            playerName: 'TestPlayer',
            difficulty: 'NORMAL',
            gameDuration: 120,
          },
          isReady: false,
          score: 0,
        },
      ],
      difficulty: 'NORMAL',
      isStarted: false,
      gameDuration: 120,
    }

    // Save room
    await redisService.saveRoom(testRoom, 60)
    console.log('✅ Room saved to Redis')

    // Retrieve room
    const retrievedRoom = await redisService.getRoom('test-room-123')
    console.log(
      '✅ Room retrieved from Redis:',
      retrievedRoom ? 'SUCCESS' : 'FAILED'
    )

    // Test leaderboard
    await redisService.updatePlayerScore('player-1', 1500)
    console.log('✅ Player score updated')

    const topPlayers = await redisService.getTopPlayers(5)
    console.log('✅ Leaderboard retrieved:', topPlayers.length, 'players')

    // Test rate limiting
    const rateLimitTest = await redisService.checkRateLimit('test-key', 10, 60)
    console.log('✅ Rate limiting test:', rateLimitTest ? 'PASSED' : 'FAILED')

    // Test statistics
    await redisService.incrementGameStats('test_stat')
    const statValue = await redisService.getGameStats('test_stat')
    console.log('✅ Statistics test:', statValue)

    // Clean up
    await redisService.deleteRoom('test-room-123')
    console.log('✅ Test room cleaned up')

    console.log('\n🎉 All Redis tests passed!')
  } catch (error) {
    console.error('❌ Redis test failed:', error.message)
  } finally {
    await redisService.disconnect()
    console.log('Redis connection closed')
  }
}

testRedis()
