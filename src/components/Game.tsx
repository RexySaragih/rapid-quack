import React, { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { GameScene } from '../game/scenes/GameScene'
import { WordDifficulty } from '../shared/types/word'
import { socketService } from '../services/socketService'

interface GameProps {
  difficulty: WordDifficulty
  onGameOver: (score: number) => void
  onLeave: () => void  // Add onLeave prop like WaitingRoom
  shouldStart: boolean
  isMultiplayer?: boolean
  roomId?: string
  gameDuration: number // Add gameDuration to props
}

const Game: React.FC<GameProps> = ({
  difficulty: _difficulty,
  onGameOver: _onGameOver,
  onLeave,  // Add onLeave to destructured props
  shouldStart,
  isMultiplayer = false,
  roomId,
  gameDuration
}) => {
  console.log('Game component rendered with difficulty:', _difficulty, 'duration:', gameDuration)
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [_hasFocus, setHasFocus] = useState(false)
  const sceneRef = useRef<GameScene | null>(null)
  const [showRoomGameOver, setShowRoomGameOver] = useState(false)
  const [gameStats, setGameStats] = useState<any>(null)

  useEffect(() => {
    console.log('Game useEffect triggered with difficulty:', _difficulty, 'duration:', gameDuration)

    // Destroy existing game if it exists
    if (gameRef.current) {
      console.log('Destroying existing game')
      gameRef.current.destroy(true)
      gameRef.current = null
      sceneRef.current = null
    }

    if (!containerRef.current) return

    // Create GameScene with difficulty
    class GameSceneWithConfig extends GameScene {
      constructor() {
        if (!gameDuration) {
          console.error('Game duration is undefined!')
          throw new Error('Game duration must be defined')
        }
        super(_difficulty, gameDuration) // Pass game duration to GameScene
        this.isMultiplayer = isMultiplayer
        this.roomId = roomId
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: containerRef.current,
      backgroundColor: '#1a1a2e',
      scene: [GameSceneWithConfig],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      input: {
        keyboard: true,
        mouse: true,
        touch: true,
      },
    }

    // Create game with scene data
    const game = new Phaser.Game(config)
    gameRef.current = game

    // Listen for the custom scene-ready event
    const handleSceneReady = (sceneInstance: GameScene) => {
      sceneRef.current = sceneInstance
      // Always start the game if shouldStart is true
      if (shouldStart) {
        sceneRef.current.startGame().catch(error => {
          console.error('Error starting game:', error)
        })
      }
    }
    game.events.on('scene-ready', handleSceneReady)

    // Set up multiplayer event handlers
    if (isMultiplayer && roomId && sceneRef.current) {
      socketService.onDuckSpawn(duckData => {
        if (sceneRef.current) {
          sceneRef.current.handleRemoteDuckSpawn(duckData)
        }
      })

      socketService.onDuckHit(duckId => {
        if (sceneRef.current) {
          sceneRef.current.handleDuckHit(duckId, true)
        }
      })

      socketService.onOpponentScore(score => {
        if (sceneRef.current) {
          sceneRef.current.updateOpponentScore(score)
        }
      })

      socketService.onEffect(effectData => {
        if (sceneRef.current) {
          sceneRef.current.handleRemoteEffect(effectData)
        }
      })

      socketService.onError(error => {
        if (sceneRef.current) {
          sceneRef.current.showError(error)
        }
      })

      socketService.onConnectionStateChange(isConnected => {
        if (sceneRef.current) {
          sceneRef.current.handleConnectionState(isConnected)
        }
      })
    }

    return () => {
      // Cleanup socket listeners
      if (isMultiplayer) {
        socketService.offDuckSpawn()
        socketService.offDuckHit()
        socketService.offOpponentScore()
        socketService.offEffect()
        socketService.offError()
        socketService.offConnectionStateChange()
      }
      // Remove Phaser event listener
      if (gameRef.current) {
        gameRef.current.events.off('scene-ready', handleSceneReady)
      }
    }
  }, [_difficulty, isMultiplayer, roomId, shouldStart, gameDuration])

  // Listen for Phaser 'room-gameover' event
  useEffect(() => {
    if (!gameRef.current) return
    const phaserGame = gameRef.current
    const handler = (room: any) => {
      setShowRoomGameOver(true)
      // Set the complete room data for the leaderboard
      setGameStats(room)
    }
    phaserGame.events.on('room-gameover', handler)
    return () => {
      phaserGame.events.off('room-gameover', handler)
    }
  }, [gameRef.current])

  const handleLeave = () => {
    if (roomId) {
      socketService.leaveRoom(roomId)
    }
    setShowRoomGameOver(false)
    onLeave() // Use onLeave prop like WaitingRoom does
  }

  // Block typing area after game over
  const typingBlocked = showRoomGameOver

  // Canvas focus management and resize handling
  useEffect(() => {
    // Ensure the canvas gets focus for keyboard input
    const canvas = containerRef.current?.querySelector('canvas')
    if (canvas) {
      canvas.setAttribute('tabindex', '0')
      canvas.focus()
      setHasFocus(true)

      // Add focus/blur handlers
      const handleFocus = () => setHasFocus(true)
      const handleBlur = () => setHasFocus(false)
      const handleCanvasClick = () => {
        canvas.focus()
      }

      canvas.addEventListener('focus', handleFocus)
      canvas.addEventListener('blur', handleBlur)
      canvas.addEventListener('click', handleCanvasClick)

      return () => {
        canvas.removeEventListener('focus', handleFocus)
        canvas.removeEventListener('blur', handleBlur)
        canvas.removeEventListener('click', handleCanvasClick)
      }
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current && gameRef.current.scale) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [gameRef.current])

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20"></div>

      <div
        ref={containerRef}
        className="relative w-full h-full"
        style={{
          background: '#1a1a2e',
        }}
      >
        {/* Block typing area overlay */}
        {typingBlocked && (
          <div className="absolute inset-0 bg-black bg-opacity-40 z-50 cursor-not-allowed" />
        )}
      </div>

      {/* Room Game Over Modal */}
      {isMultiplayer && showRoomGameOver && gameStats && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg p-8 shadow-lg text-center border-2 border-cyan-400 min-w-[500px]">
            <h2 className="text-3xl font-bold text-cyan-300 mb-4">Game Over - Leaderboard</h2>
            {/* Leaderboard Table */}
            <table className="w-full text-white mb-6 border-separate border-spacing-y-2">
              <thead>
                <tr className="text-cyan-200 text-lg">
                  <th className="px-4">Rank</th>
                  <th className="px-4">Player</th>
                  <th className="px-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {gameStats.players
                  ?.sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
                  ?.map((player: any, index: number) => (
                    <tr key={player.id} className="bg-slate-800 rounded">
                      <td className="px-4 py-2 font-bold">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </td>
                      <td className="px-4 py-2 font-bold text-left">
                        {player.id === socketService.getSocketId() ? 'You' : (player.name?.playerName || 'Unknown Player')}
                      </td>
                      <td className="px-4 py-2">{player.score || 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="flex justify-center">
              <button
                onClick={handleLeave}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game