import { WordDifficulty } from '../shared/types/word'

export interface Player {
  id: string
  name: {
    playerName: string
    difficulty?: string
    gameDuration?: number
  }
  isReady: boolean
  score: number
  isGameOver?: boolean // Track if player is game over
  isRematchReady?: boolean // Track if player is ready for rematch
}

export interface GameRoom {
  id: string
  players: Player[]
  difficulty: WordDifficulty
  isStarted: boolean
  gameDuration?: number // Add gameDuration to GameRoom
}

export interface DuckData {
  id: string
  x: number
  y: number
  word: string
  difficulty: WordDifficulty
  points: number
  speed: number
}

export interface EffectData {
  type: 'hit' | 'combo' | 'score'
  x: number
  y: number
  color?: number
  value?: number
  comboCount?: number
}

export interface ChatMessage {
  playerName: string
  message: string
  timestamp: number
}

export interface ServerToClientEvents {
  'room:created': (room: GameRoom) => void
  'room:joined': (room: GameRoom) => void
  'room:updated': (room: GameRoom) => void
  'game:start': (room: GameRoom) => void
  'player:score': (playerId: string, score: number) => void
  'duck:spawn': (duckData: DuckData) => void
  'duck:hit': (duckId: string) => void
  'chat:message': (messageData: ChatMessage) => void // New chat event
  error: (data: { message: string }) => void
  'room:gameover': (room: GameRoom) => void // New event for room-wide game over
  'rematch:status': (room: GameRoom) => void // Rematch status update
  'rematch:start': () => void // Rematch start event
}

export interface ClientToServerEvents {
  'room:create': (playerData: {playerName: string, difficulty: WordDifficulty, gameDuration: number}) => void
  'room:join': (roomId: string, playerName: string) => void
  'room:leave': (roomId: string) => void
  'player:ready': (roomId: string) => void
  'player:score': (roomId: string, score: number) => void
  'duck:spawn': (roomId: string, duckData: DuckData) => void
  'duck:hit': (roomId: string, duckId: string) => void
  'player:gameover': (roomId: string) => void // New event for player game over
  'rematch:request': (roomId: string) => void // Rematch request event
  'chat:message': (roomId: string, messageData: ChatMessage) => void // New chat event
}
