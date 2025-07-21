import React from 'react'

interface GameOverProps {
  finalScore: number
  onRestart: () => void
}

export const GameOver: React.FC<GameOverProps> = ({ finalScore, onRestart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center text-white">
        <div className="bg-black bg-opacity-50 rounded-lg p-8 border-2 border-red-500">
          <h2 className="text-6xl font-bold mb-6 font-orbitron text-red-500">
            GAME OVER
          </h2>
          <div className="text-3xl mb-8">
            Final Score: {finalScore}
          </div>
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Press SPACE to restart
          </button>
        </div>
      </div>
    </div>
  )
} 