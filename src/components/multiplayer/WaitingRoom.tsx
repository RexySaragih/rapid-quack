import React, { useEffect, useState, useRef } from 'react'
import { socketService } from '../../services/socketService'
import type { GameRoom } from '../../services/socketService'
import { WordDifficulty } from '../../shared/types/word'

interface ChatMessage {
  id: string
  playerName: string
  message: string
  timestamp: number
  type: 'user' | 'system'
}

interface WaitingRoomProps {
  roomId: string
  onGameStart: (room: GameRoom) => void
  onLeave: () => void
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomId,
  onGameStart,
  onLeave,
}) => {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [error, setError] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)
  const [previousPlayers, setPreviousPlayers] = useState<string[]>([])

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Helper function to add system message
  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      playerName: 'System',
      message,
      timestamp: Date.now(),
      type: 'system',
    }
    setChatMessages(prev => [...prev, systemMessage])
  }

  // Helper function to check for player changes
  const checkPlayerChanges = (newRoom: GameRoom) => {
    const currentPlayerNames = newRoom.players.map(p => p.name.playerName)
    const previousPlayerNames = previousPlayers

    // Check for new players (joined)
    const newPlayers = currentPlayerNames.filter(
      name => !previousPlayerNames.includes(name)
    )
    newPlayers.forEach(playerName => {
      addSystemMessage(`${playerName} joined the room`)
    })

    // Check for left players (left)
    const leftPlayers = previousPlayerNames.filter(
      name => !currentPlayerNames.includes(name)
    )
    leftPlayers.forEach(playerName => {
      addSystemMessage(`${playerName} left the room`)
    })

    setPreviousPlayers(currentPlayerNames)
  }

  useEffect(() => {
    console.log('WaitingRoom mounted with roomId:', roomId)

    // Ensure socket connection
    if (!socketService.isConnected()) {
      console.log('Socket not connected, connecting...')
      socketService.connect()
    }

    // Set up event listeners
    socketService.onRoomUpdated(updatedRoom => {
      console.log('updatedRoom', updatedRoom)
      console.log(
        'Room updated:',
        updatedRoom,
        'Duration:',
        updatedRoom.gameDuration
      )
      if (updatedRoom.id === roomId) {
        // Ensure we're getting a proper GameRoom object
        const validRoom: GameRoom = {
          id: updatedRoom.id || roomId,
          players: Array.isArray(updatedRoom.players)
            ? updatedRoom.players
            : [],
          difficulty: updatedRoom.difficulty || WordDifficulty.NORMAL,
          isStarted: !!updatedRoom.isStarted,
          gameDuration: updatedRoom.gameDuration || 120,
          rematchCount: updatedRoom.rematchCount,
        }
        console.log('Setting room with validated data:', validRoom)

        // Check for player changes and add system messages
        if (room) {
          checkPlayerChanges(validRoom)
        } else {
          // First time loading the room
          setPreviousPlayers(validRoom.players.map(p => p.name.playerName))
        }

        setRoom(validRoom)
      }
    })

    socketService.onGameStart(startedRoom => {
      console.log(
        'Game starting:',
        startedRoom,
        'Duration:',
        startedRoom.gameDuration
      )
      if (startedRoom.id === roomId) {
        addSystemMessage('Game is starting! 🎮')
        onGameStart(startedRoom)
      }
    })

    // Set up error handler
    socketService.onError(errorMessage => {
      console.error('Socket error:', errorMessage)
      setError(errorMessage)
    })

    // Set up chat message listener
    console.log('Setting up chat message listener for room:', roomId)
    socketService.onChatMessage(messageData => {
      console.log('Chat message received in component:', messageData)
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        playerName: messageData.playerName,
        message: messageData.message,
        timestamp: messageData.timestamp || Date.now(),
        type: 'user',
      }
      setChatMessages(prev => [...prev, chatMessage])
    })

    // Request initial room data
    socketService.requestRoomData(roomId)

    // Cleanup listeners on unmount
    return () => {
      socketService.offRoomUpdated()
      socketService.offGameStart()
      socketService.offError()
      socketService.offChatMessage()
    }
  }, [roomId, onGameStart])

  const handleReady = () => {
    try {
      socketService.setReady(roomId)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to set ready status'
      )
    }
  }

  const handleLeave = () => {
    addSystemMessage('You left the room')
    socketService.leaveRoom(roomId)
    onLeave()
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const playerName =
      room?.players.find(p => p.id === socketService.getSocketId())?.name
        ?.playerName || 'Unknown'

    console.log('Sending chat message:', {
      roomId,
      playerName,
      message: chatInput.trim(),
      timestamp: Date.now(),
    })

    socketService.sendChatMessage(roomId, {
      playerName,
      message: chatInput.trim(),
      timestamp: Date.now(),
    })

    setChatInput('')
  }

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-game-background">
        <div className="text-white text-2xl animate-pulse">
          Loading room data...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-game-background text-white p-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-6xl w-full">
        <h2 className="text-3xl font-bold mb-6 text-center">Waiting Room</h2>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Room Info */}
          <div className="space-y-6">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">
                Room ID
              </div>
              <div className="text-xl font-mono bg-slate-700 p-2 rounded select-all">
                {room.id}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-400 mb-2">
                Players
              </div>
              <div className="space-y-2">
                {Array.isArray(room.players) &&
                  room.players.map(player => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-slate-700 p-2 rounded"
                    >
                      <span>
                        {String(player.name?.playerName || 'Unknown Player')}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          player.isReady
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {player.isReady ? 'Ready' : 'Not Ready'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">
                Game Settings
              </div>
              <div className="bg-slate-700 p-2 rounded">
                <div className="flex justify-between">
                  <span>Difficulty:</span>
                  <span className="capitalize">{String(room.difficulty)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Duration:</span>
                  <span>{Number(room.gameDuration)} seconds</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReady}
                className={`w-full px-6 py-2 rounded transition-colors ${
                  room.players.find(p => p.id === socketService.getSocketId())
                    ?.isReady
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {room.players.find(p => p.id === socketService.getSocketId())
                  ?.isReady
                  ? 'Ready!'
                  : 'Ready Up'}
              </button>

              <button
                onClick={handleLeave}
                className="w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>

          {/* Right Column - Chat */}
          <div className="flex flex-col h-96">
            <div className="text-sm font-medium text-gray-400 mb-2">Chat</div>

            {/* Chat Messages */}
            <div className="flex-1 bg-slate-700 rounded p-3 mb-3 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-gray-500 text-center text-sm py-8">
                  No messages yet. Say hello! 👋
                </div>
              ) : (
                <div className="space-y-2">
                  {chatMessages.map(msg => {
                    if (msg.type === 'system') {
                      return (
                        <div key={msg.id} className="text-sm text-center">
                          <span className="text-gray-400 italic">
                            {msg.message}
                          </span>
                          <span className="ml-2 text-gray-500 text-xs">
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                      )
                    }

                    const isOwnMessage =
                      room?.players.find(
                        p => p.id === socketService.getSocketId()
                      )?.name?.playerName === msg.playerName
                    return (
                      <div key={msg.id} className="text-sm">
                        <span
                          className={`font-medium ${
                            isOwnMessage ? 'text-green-400' : 'text-cyan-400'
                          }`}
                        >
                          {isOwnMessage ? 'You' : msg.playerName}:
                        </span>
                        <span className="ml-2 text-gray-200">
                          {msg.message}
                        </span>
                        <span className="ml-2 text-gray-400 text-xs">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                    )
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              <div className="text-xs text-gray-400 text-right">
                {chatInput.length}/200 characters
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
