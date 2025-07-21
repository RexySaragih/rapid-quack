import React from 'react'

interface WelcomePageProps {
  onPlay: () => void
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onPlay }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4 font-orbitron">
          Welcome to Rapid Quack
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Come on, quackhead, make a move!
        </p>
        <button
          onClick={onPlay}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Play
        </button>
      </div>
    </div>
  )
} 