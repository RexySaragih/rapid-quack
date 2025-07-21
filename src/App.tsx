import { useState } from 'react'
import { WelcomePage } from './components/WelcomePage'
import { ModeSelection } from './components/ModeSelection'
import { DifficultySelection } from './components/DifficultySelection'
import { CreateRoom } from './components/multiplayer/CreateRoom'
import { JoinRoom } from './components/multiplayer/JoinRoom'
import { WaitingRoom } from './components/multiplayer/WaitingRoom'
import Game from './components/Game'
import { WordDifficulty } from './shared/types/word'
import { socketService } from './services/socketService'
import type { GameRoom } from './services/socketService'

type GameMode = 'single' | 'multi'
type GameState =
  | 'welcome'
  | 'mode'
  | 'difficulty'
  | 'create-room'
  | 'join-room'
  | 'waiting-room'
  | 'playing'

export default function App() {
  const [gameState, setGameState] = useState<GameState>('welcome')
  const [difficulty, setDifficulty] = useState<WordDifficulty>(
    WordDifficulty.NORMAL
  )
  const [roomId, setRoomId] = useState<string>('')
  const [gameMode, setGameMode] = useState<GameMode>('single')
  const [gameDuration, setGameDuration] = useState<number>(120) // Set initial value and type

  // Handle navigation
  const handleStart = () => setGameState('mode')
  const handleBack = () => {
    switch (gameState) {
      case 'mode':
        setGameState('welcome')
        break
      case 'difficulty':
        setGameState('mode')
        break
      case 'create-room':
      case 'join-room':
        setGameState('mode')
        break
      case 'waiting-room':
        socketService.leaveRoom(roomId)
        setGameState('mode')
        break
      default:
        setGameState('welcome')
    }
  }

  // Handle mode selection
  const handleSinglePlayer = () => {
    setGameMode('single')
    setGameState('difficulty')
  }

  const handleMultiplayer = () => {
    setGameMode('multi')
    setGameState('create-room')
  }

  const handleEnterRoom = () => {
    setGameMode('multi')
    setGameState('join-room')
  }

  // Handle difficulty selection
  const handleDifficultySelect = (selectedDifficulty: WordDifficulty) => {
    setDifficulty(selectedDifficulty)
    if (gameMode === 'single') {
      setGameState('playing')
    }
  }

  // Handle room events
  const handleRoomCreated = (newRoomId: string) => {
    setRoomId(newRoomId)
    setGameState('waiting-room')
  }

  const handleRoomJoined = (joinedRoomId: string) => {
    setRoomId(joinedRoomId)
    setGameState('waiting-room')
  }

  const handleGameStart = (room: GameRoom) => {
    console.log('Game starting with duration:', room.gameDuration)
    setDifficulty(room.difficulty)
    setGameDuration(room.gameDuration || 120) // Provide fallback
    setGameState('playing')
  }

  // Handle game over
  const handleGameOver = (score: number) => {
    console.log('Game Over! Score:', score)
    if (gameMode === 'multi') {
      socketService.leaveRoom(roomId)
    }
    setGameState('welcome')
  }

  // Render current game state
  switch (gameState) {
    case 'welcome':
      return <WelcomePage onPlay={handleStart} />

    case 'mode':
      return (
        <ModeSelection
          onSinglePlayer={handleSinglePlayer}
          onMultiplayer={handleMultiplayer}
          onEnterRoom={handleEnterRoom}
        />
      )

    case 'difficulty':
      return <DifficultySelection onDifficultySelect={handleDifficultySelect} />

    case 'create-room':
      return (
        <CreateRoom onBack={handleBack} onRoomCreated={handleRoomCreated} />
      )

    case 'join-room':
      return <JoinRoom onBack={handleBack} onRoomJoined={handleRoomJoined} />

    case 'waiting-room':
      return (
        <WaitingRoom
          roomId={roomId}
          onGameStart={handleGameStart}
          onLeave={handleBack}
        />
      )

    case 'playing':
      return (
        <Game
          difficulty={difficulty}
          onGameOver={handleGameOver}
          onLeave={handleBack}  // Pass handleBack as onLeave prop
          shouldStart={true}
          isMultiplayer={gameMode === 'multi'}
          roomId={gameMode === 'multi' ? roomId : undefined}
          gameDuration={gameDuration} // Pass game duration to Game component
        />
      )

    default:
      return <WelcomePage onPlay={handleStart} />
  }
}
