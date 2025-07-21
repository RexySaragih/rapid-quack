import { WordDifficulty, WordData, WordList } from '../types/word'
import { easyWords } from './fallbackWords/easy'
import { normalWords } from './fallbackWords/normal'
import { hardWords } from './fallbackWords/hard'
import { expertWords } from './fallbackWords/expert'
import { duckapocalypseWords } from './fallbackWords/duckapocalypse'

const FALLBACK_WORDS: WordList = {
  [WordDifficulty.EASY]: easyWords,
  [WordDifficulty.NORMAL]: normalWords,
  [WordDifficulty.HARD]: hardWords,
  [WordDifficulty.EXPERT]: expertWords,
  [WordDifficulty.DUCKAPOCALYPSE]: duckapocalypseWords,
}

class WordGenerator {
  private static instance: WordGenerator
  private cachedWords: Map<WordDifficulty, string[]> = new Map()
  private isInitialized: boolean = false

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): WordGenerator {
    if (!WordGenerator.instance) {
      WordGenerator.instance = new WordGenerator()
    }
    return WordGenerator.instance
  }

  public getRandomWord(difficulty: WordDifficulty): WordData {
    // Get words for the specified difficulty
    const words = FALLBACK_WORDS[difficulty]
    if (!words || words.length === 0) {
      console.error(`No words available for difficulty: ${difficulty}`)
      return this.getFallbackWord(difficulty)
    }

    // Select a random word
    const word = words[Math.floor(Math.random() * words.length)]
    return {
      word,
      difficulty,
      points: this.calculatePoints(word, difficulty),
    }
  }

  private getFallbackWord(difficulty: WordDifficulty): WordData {
    // Use a simple word as fallback
    const fallbackWord = 'duck'
    return {
      word: fallbackWord,
      difficulty,
      points: this.calculatePoints(fallbackWord, difficulty),
    }
  }

  private calculatePoints(word: string, difficulty: WordDifficulty): number {
    const basePoints = {
      [WordDifficulty.EASY]: 10,
      [WordDifficulty.NORMAL]: 20,
      [WordDifficulty.HARD]: 30,
      [WordDifficulty.EXPERT]: 50,
      [WordDifficulty.DUCKAPOCALYPSE]: 100,
    }

    // Calculate bonus points based on word length
    const lengthBonus = Math.floor(word.length * 2)

    return basePoints[difficulty] + lengthBonus
  }

  public getDifficultyInfo(difficulty: WordDifficulty) {
    const difficultyInfo = {
      [WordDifficulty.EASY]: {
        color: '#4ade80', // green
        minWordLength: 3,
        maxWordLength: 5,
      },
      [WordDifficulty.NORMAL]: {
        color: '#60a5fa', // blue
        minWordLength: 6,
        maxWordLength: 8,
      },
      [WordDifficulty.HARD]: {
        color: '#f472b6', // pink
        minWordLength: 9,
        maxWordLength: 12,
      },
      [WordDifficulty.EXPERT]: {
        color: '#7c3aed', // purple
        minWordLength: 13,
        maxWordLength: 18,
      },
      [WordDifficulty.DUCKAPOCALYPSE]: {
        color: '#ef4444', // red
        minWordLength: 19,
        maxWordLength: 100,
      },
    }

    return difficultyInfo[difficulty]
  }
}

export const wordGenerator = WordGenerator.getInstance()
