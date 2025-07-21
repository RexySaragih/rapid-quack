import React, { useEffect } from 'react'
import { wordGenerator } from '../shared/utils/wordGenerator'
import { WordDifficulty } from '../shared/types/word'

interface LoadingScreenProps {
  difficulty: string
  onReady: () => void
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  difficulty,
  onReady,
}) => {
  useEffect(() => {
    console.log('LoadingScreen: Starting word generator initialization...')

    // Initialize word generator and wait for it to complete
    const initializeWords = async () => {
      try {
        console.log('LoadingScreen: Waiting for API response...')

        // Add timeout to prevent infinite waiting
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API timeout')), 10000) // 10 second timeout
        })

        // Force word generator to initialize and wait for API response
        await Promise.race([
          wordGenerator.getRandomWord(WordDifficulty.NORMAL),
          timeoutPromise,
        ])

        console.log(
          'LoadingScreen: Word generator initialized successfully with API words'
        )

        // Wait minimum time to show loading screen
        setTimeout(() => {
          console.log('LoadingScreen: Loading complete, starting game...')
          onReady()
        }, 1500) // Minimum 1.5 seconds loading time
      } catch (error) {
        console.error(
          'LoadingScreen: Error initializing word generator:',
          error
        )
        // Even if API fails, proceed with fallback words after a delay
        setTimeout(() => {
          console.log('LoadingScreen: Proceeding with fallback words...')
          onReady()
        }, 1500) // Minimum 1.5 seconds loading time
      }
    }

    // Start word initialization immediately
    initializeWords()
  }, [onReady])
  return (
    <div className="absolute inset-0 bg-game-background flex flex-col items-center justify-center z-20">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-8 font-orbitron">
          Loading Game...
        </h2>

        <div className="mb-8">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>

        <div className="text-xl text-gray-300 mb-4 font-orbitron">
          Preparing your challenge
        </div>

        <div className="text-lg text-blue-400 font-orbitron">
          Difficulty: {difficulty}
        </div>

        <div className="mt-8 text-sm text-gray-400 font-orbitron">
          Get ready to type fast!
        </div>
      </div>
    </div>
  )
}
