import React, { useState } from 'react'
import { socketService } from '../../services/socketService'

interface JoinRoomProps {
  onBack: () => void
  onRoomJoined: (roomId: string) => void
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ onBack, onRoomJoined }) => {
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId.trim() || !playerName.trim()) {
      setError('Please fill in all fields')
      return
    }

    // Connect to socket if not already connected
    socketService.connect()

    // Set up room joined listener
    socketService.onRoomJoined(room => {
      onRoomJoined(room.id)
    })

    // Join room
    socketService.joinRoom(roomId.trim(), playerName.trim())
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-game-background text-white p-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center">Join Room</h2>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium mb-1">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room ID"
            />
          </div>

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
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Join Game
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
