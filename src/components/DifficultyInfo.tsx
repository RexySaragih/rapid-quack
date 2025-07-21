import React from 'react'
import { wordGenerator } from '../shared/utils/wordGenerator'
import { WordDifficulty } from '../shared/types/word'

export const DifficultyInfo: React.FC = () => {
  // Get all difficulties from WordDifficulty enum
  const difficulties = Object.values(WordDifficulty)

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Difficulty Info</h2>
      <div className="space-y-4">
        {difficulties.map((difficulty: WordDifficulty) => {
          const info = wordGenerator.getDifficultyInfo(difficulty)
          return (
            <div
              key={difficulty}
              className="bg-slate-700 p-4 rounded"
              style={{ borderLeft: `4px solid ${info.color}` }}
            >
              <div className="flex justify-between items-center">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: info.color }}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </h3>
                <div className="text-sm text-gray-400">
                  {info.minWordLength}-{info.maxWordLength} letters
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
