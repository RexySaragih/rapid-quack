import React, { useState, useEffect } from 'react'
import { socketService } from '../../services/socketService'
import { WordDifficulty } from '../../shared/types/word'

interface CreateRoomProps {
  onBack: () => void
  onRoomCreated: (roomId: string) => void
}

export const CreateRoom: React.FC<CreateRoomProps> = ({
  onBack,
  onRoomCreated,
}) => {
  const [playerName, setPlayerName] = useState('')
  const [difficulty, setDifficulty] = useState<WordDifficulty>(
    WordDifficulty.NORMAL
  )
  const [gameDuration, setGameDuration] = useState(120) // Start with 120 seconds
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Set up error handler
    socketService.onError(errorMessage => {
      setError(errorMessage)
      setIsLoading(false)
      setIsConnecting(false)
    })

    // Set up connection state handler
    socketService.onConnectionStateChange(isConnected => {
      setIsConnecting(false)
      if (!isConnected) {
        setError('Lost connection to server')
        setIsLoading(false)
      }
    })

    return () => {
      socketService.offError()
      socketService.offConnectionStateChange()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!gameDuration || gameDuration <= 0) {
      setError('Please select a valid game duration')
      return
    }

    setError('')
    setIsLoading(true)
    setIsConnecting(true)

    try {
      // Connect to socket if not already connected
      socketService.connect()

      // Set up room created listener
      socketService.onRoomCreated(room => {
        console.log('room settings', JSON.stringify(room))
        console.log('Room created with duration:', room.gameDuration)
        setIsLoading(false)
        onRoomCreated(room.id)
      })

      // Create room with game duration
      console.log('Creating room with duration:', gameDuration)
      socketService.createRoom(playerName.trim(), difficulty, gameDuration)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
      setIsLoading(false)
      setIsConnecting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-game-background text-white p-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center">Create Room</h2>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="playerName"
              className="block text-sm font-medium mb-1"
            >
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium mb-1"
            >
              Game Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as WordDifficulty)}
              className="w-full px-3 py-2 bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {Object.values(WordDifficulty).map(diff => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="gameDuration"
              className="block text-sm font-medium mb-1"
            >
              Game Duration
            </label>
            <select
              id="gameDuration"
              value={gameDuration}
              onChange={e => setGameDuration(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={90}>90 seconds</option>
              <option value={120}>120 seconds</option>
            </select>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 relative"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="opacity-0">Create Game</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isConnecting ? 'Connecting...' : 'Creating...'}
                  </div>
                </>
              ) : (
                'Create Game'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
