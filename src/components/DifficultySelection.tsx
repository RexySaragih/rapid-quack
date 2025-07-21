import React from 'react'
import { WordDifficulty } from '../shared/types/word'

interface DifficultySelectionProps {
  onDifficultySelect: (difficulty: WordDifficulty) => void
}

export const DifficultySelection: React.FC<DifficultySelectionProps> = ({
  onDifficultySelect,
}) => {
  const difficulties = [
    { difficulty: WordDifficulty.EASY, name: 'Easy', color: '#10b981' },
    { difficulty: WordDifficulty.NORMAL, name: 'Normal', color: '#3b82f6' },
    { difficulty: WordDifficulty.HARD, name: 'Hard', color: '#f59e0b' },
    { difficulty: WordDifficulty.EXPERT, name: 'Expert', color: '#ef4444' },
    {
      difficulty: WordDifficulty.DUCKAPOCALYPSE,
      name: 'Duckpocalypse',
      color: '#8b5cf6',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center text-white">
        <h2 className="text-4xl font-bold mb-8 font-orbitron">
          Select Difficulty
        </h2>
        <div className="space-y-4">
          {difficulties.map(({ difficulty, name, color }) => (
            <button
              key={difficulty}
              onClick={() => onDifficultySelect(difficulty)}
              className="w-80 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-transparent hover:border-white"
              style={{ borderColor: color }}
            >
              <div className="flex justify-between items-center">
                <span className="text-lg">{name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
