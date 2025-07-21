import React from 'react'

interface ModeSelectionProps {
  onSinglePlayer: () => void
  onMultiplayer: () => void
  onEnterRoom: () => void
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({
  onSinglePlayer,
  onMultiplayer,
  onEnterRoom,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center text-white">
        <h2 className="text-6xl font-bold mb-8 font-orbitron">Select Mode</h2>
        <div className="space-y-4">
          <button
            onClick={onSinglePlayer}
            className="w-80 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Single Player
          </button>
          <button
            onClick={onMultiplayer}
            className="w-80 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Compete with Friend
          </button>
          <button
            onClick={onEnterRoom}
            className="w-80 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Enter Room ID
          </button>
        </div>
      </div>
    </div>
  )
}
