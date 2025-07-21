import Phaser from 'phaser'
import { wordGenerator } from '../../shared/utils/wordGenerator'
import { WordData, WordDifficulty } from '../../shared/types/word'
import { AudioManager } from '../audio/AudioManager'
import { ParticleManager } from '../effects/ParticleManager'
import { socketService } from '../../services/socketService'

interface DuckData {
  id: string
  x: number
  y: number
  word: string
  difficulty: WordDifficulty
  points: number
  speed: number
}

export class GameScene extends Phaser.Scene {
  private ducks!: Phaser.GameObjects.Group
  private score: number = 0
  private scoreText!: Phaser.GameObjects.Text
  private inputText!: Phaser.GameObjects.Text
  private currentWord: string = ''
  private cursorText!: Phaser.GameObjects.Text
  private difficultyText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text
  private combo: number = 0
  public currentDifficulty: WordDifficulty
  private gameTimer!: number // Will be set in constructor from user settings
  private timerText!: Phaser.GameObjects.Text
  private audioManager!: AudioManager
  private particleManager!: ParticleManager
  private gameStarted: boolean = false
  private gameEnded: boolean = false
  public isMultiplayer: boolean = false
  public roomId?: string
  private opponentScoreText?: Phaser.GameObjects.Text

  private duckMap: Map<string, Phaser.GameObjects.Text> = new Map()
  private lastDuckSpawnTime: number = 0
  private spawnInterval: number = 2000 // 2 seconds
  private gameStartTime: number = 0
  private wordsHit: number = 0
  private wordsMissed: number = 0

  constructor(difficulty: WordDifficulty, gameDuration: number) {
    super({ key: 'GameScene' })
    console.log('GameScene constructor - Initializing with duration:', gameDuration)
    this.currentDifficulty = difficulty
    this.gameTimer = gameDuration // Remove fallback to force proper duration passing
    console.log(
      'GameScene constructor initialized with difficulty:',
      difficulty,
      'duration:',
      this.gameTimer
    )
  }

  preload() {
    // Try to preload audio assets but don't fail if they don't exist
    console.log('Attempting to load audio assets...')
    
    // OPTION: Set this to false to completely disable audio loading
    const enableAudio = true
    
    if (enableAudio) {
      // Set up error handlers for audio loading
      this.load.on('filefailed', (key: string) => {
        console.warn(`Failed to load audio file: ${key}`)
      })

      this.load.on('loaderror', (file: any) => {
        console.warn(`Loader error for file: ${file.key}`)
      })

      // Try to load audio files (these will fail gracefully if not found)
      this.load.audio('hit', 'assets/audio/hit.wav')
      this.load.audio('combo', 'assets/audio/combo.wav')
      this.load.audio('duck_spawn', 'assets/audio/duck_spawn.wav')
      this.load.audio('game_over', 'assets/audio/game_over.wav')
      this.load.audio('opponent_hit', 'assets/audio/opponent_hit.wav')
      this.load.audio('background_music', 'assets/audio/background_music.wav')
    }
    
    console.log('Audio loading setup complete (files may not exist)')
  }

  create() {
    // Initialize managers
    this.audioManager = new AudioManager(this)
    this.particleManager = new ParticleManager(this)

    // Initialize game objects
    this.ducks = this.add.group()

    // Get screen dimensions and define padding
    const { width, height } = this.scale.gameSize
    const padding = 40 // Increased padding for better spacing

    // Create score display
    this.scoreText = this.add.text(padding, padding, 'Score: 0', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Orbitron',
    })

    // Create opponent score display for multiplayer
    if (this.isMultiplayer) {
      this.opponentScoreText = this.add.text(padding, padding + 40, 'Opponent: 0', {
        fontSize: '24px',
        color: '#ff4444',
        fontFamily: 'Orbitron',
      })
    }

    // Create difficulty display
    this.difficultyText = this.add.text(
      padding,
      this.isMultiplayer ? padding + 80 : padding + 40,
      `Difficulty: ${this.currentDifficulty}`,
      {
        fontSize: '18px',
        color: wordGenerator.getDifficultyInfo(this.currentDifficulty).color,
        fontFamily: 'Orbitron',
      }
    )

    // Create combo display
    this.comboText = this.add.text(
      padding,
      this.isMultiplayer ? padding + 105 : padding + 65,
      'Combo: 0',
      {
        fontSize: '18px',
        color: '#fbbf24',
        fontFamily: 'Orbitron',
      }
    )

    // Create timer display
    this.timerText = this.add.text(
      padding,
      this.isMultiplayer ? padding + 130 : padding + 90,
      'Time: 2:00',
      {
        fontSize: '18px',
        color: '#00ff00',
        fontFamily: 'Orbitron',
      }
    )

    // Create input display (positioned at bottom of screen with padding)
    this.inputText = this.add.text(
      padding,
      height - padding - 30,
      'Type words to shoot ducks! (Click to focus)',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Orbitron',
      }
    )

    // Create cursor indicator (positioned next to input)
    this.cursorText = this.add.text(padding, height - padding - 30, '|', {
      fontSize: '24px',
      color: '#00ff00',
      fontFamily: 'Orbitron',
    })

    // Animate cursor
    this.tweens.add({
      targets: this.cursorText,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    // Set up keyboard input
    this.input.keyboard?.on('keydown', this.handleKeyDown, this)

    // Add fullscreen toggle with F11
    this.input.keyboard?.on('keydown-F11', (event: KeyboardEvent) => {
      event.preventDefault()
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen()
      } else {
        this.scale.startFullscreen()
      }
    })

    // Ensure the scene can receive keyboard input
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true
    }

    // Start background music
    this.audioManager.playMusic()

    console.log('Game scene created, waiting for difficulty to be set...')

    // Set up multiplayer event listeners
    if (this.isMultiplayer && this.roomId) {
      socketService.onDuckSpawn(duckData => {
        if (!this.duckMap.has(duckData.id)) {
          this.spawnDuck(duckData)
        }
      })

      socketService.onDuckHit(duckId => {
        this.handleDuckHit(duckId, true)
      })

      socketService.onOpponentScore(score => {
        this.updateOpponentScore(score)
      })

      socketService.onEffect(effectData => {
        this.handleRemoteEffect(effectData)
      })

      // Set up error handling
      socketService.onError(error => {
        this.showError(error)
      })

      socketService.onConnectionStateChange(isConnected => {
        this.handleConnectionState(isConnected)
      })

      // Listen for room-wide game over
      socketService.onRoomGameOver(room => {
        // Only emit a custom event for React to handle
        this.game.events.emit('room-gameover', room)
      })
    }

    // Emit a custom event to signal the scene is ready
    this.game.events.emit('scene-ready', this)

    // Listen for resize events
    this.scale.on('resize', this.handleResize, this)
  }

  private handleResize(gameSize: { width: number; height: number }) {
    const { width, height } = gameSize
    const padding = 40

    // Update input text position
    if (this.inputText) {
      this.inputText.setPosition(padding, height - padding - 30)
    }

    // Update cursor position
    if (this.cursorText) {
      this.cursorText.setPosition(padding + (this.inputText?.width || 0), height - padding - 30)
    }

    // Update duck spawn boundaries for existing ducks
    this.duckMap.forEach((duck) => {
      const currentSpeed = duck.getData('speed') || 50
      // Update tween to use new screen width with padding
      this.tweens.killTweensOf(duck)
      this.tweens.add({
        targets: duck,
        x: -padding,
        duration: ((width + padding * 2) / currentSpeed) * 1000,
        ease: 'Linear',
        onComplete: () => {
          if (this.gameStarted) {
            this.handleMissedDuck()
          }
          duck.destroy()
          const duckId = duck.getData('id')
          if (duckId) {
            this.duckMap.delete(duckId)
          }
        },
      })
    })
  }

  private createDifficultyDisplay() {
    // Create difficulty display
    this.difficultyText = this.add.text(
      16,
      this.isMultiplayer ? 88 : 56,
      `Difficulty: ${this.currentDifficulty}`,
      {
        fontSize: '18px',
        color: wordGenerator.getDifficultyInfo(this.currentDifficulty).color,
        fontFamily: 'Orbitron',
      }
    )

    console.log('Difficulty display created with:', this.currentDifficulty)
    this.updateDifficultyDisplay()
  }

  private spawnDuck(duckData?: DuckData): void {
    console.log('[spawnDuck] called. gameStarted:', this.gameStarted, 'currentDifficulty:', this.currentDifficulty)
    if (!this.currentDifficulty || !this.gameStarted) {
      console.error('[spawnDuck] Cannot spawn duck: game not started or difficulty not set')
      return
    }

    // Get screen dimensions and padding
    const { width, height } = this.scale.gameSize
    const padding = 40

    // If no duck data provided, generate new duck
    if (!duckData) {
      const wordData = wordGenerator.getRandomWord(this.currentDifficulty)
      if (!wordData) {
        console.error('[spawnDuck] Failed to generate word data')
        return
      }

      duckData = {
        id: Date.now().toString(),
        x: width - padding, // Start from right edge with padding
        y: Phaser.Math.Between(padding + 160, height - padding - 80), // Avoid UI areas with proper padding
        word: wordData.word,
        difficulty: wordData.difficulty,
        points: wordData.points,
        speed: this.getDuckSpeed(wordData.difficulty),
      }

      // In multiplayer, emit the duck spawn event
      if (this.isMultiplayer && this.roomId) {
        socketService.emitDuckSpawn(this.roomId, duckData)
      }
    }

    // Create the duck text object
    const duck = this.add.text(duckData.x, duckData.y, duckData.word, {
      fontSize: '24px',
      color: wordGenerator.getDifficultyInfo(duckData.difficulty).color,
      fontFamily: 'Orbitron',
      backgroundColor: '#00000066',
      padding: { x: 10, y: 5 },
    })

    // Store duck data
    duck.setData('wordData', {
      word: duckData.word,
      difficulty: duckData.difficulty,
      points: duckData.points,
    })
    duck.setData('id', duckData.id)
    duck.setData('speed', duckData.speed)

    // Add to groups and maps
    this.ducks.add(duck)
    this.duckMap.set(duckData.id, duck)

    // Play spawn sound
    this.audioManager.playSound('duck_spawn')

    // Start duck movement (move to left edge with padding)
    this.tweens.add({
      targets: duck,
      x: -padding,
      duration: ((width + padding * 2) / duckData.speed) * 1000,
      ease: 'Linear',
      onComplete: () => {
        if (this.gameStarted) {
          this.handleMissedDuck()
        }
        duck.destroy()
        if (duckData) {
          this.duckMap.delete(duckData.id)
        }
      },
    })
  }

  private getDuckSpeed(difficulty: WordDifficulty): number {
    const baseSpeed = 50 // pixels per second
    const speedMultipliers = {
      [WordDifficulty.EASY]: 1,
      [WordDifficulty.NORMAL]: 1.5,
      [WordDifficulty.HARD]: 2,
      [WordDifficulty.EXPERT]: 2.5,
      [WordDifficulty.DUCKAPOCALYPSE]: 3,
    }
    return baseSpeed * speedMultipliers[difficulty]
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Block input if game has ended
    if (this.gameEnded) {
      this.inputText.setText('Game Over!')
      return
    }

    console.log('Key pressed:', event.key) // Debug log

    if (event.key === 'Backspace') {
      this.currentWord = this.currentWord.slice(0, -1)
    } else if (event.key.length === 1) {
      this.currentWord += event.key
    }

    const padding = 40
    this.inputText.setText(`Type here: ${this.currentWord}`)
    this.cursorText.setPosition(padding + this.inputText.width, this.scale.gameSize.height - padding - 30)

    // Check for word matches in real-time as player types
    this.checkWordInRealTime()
  }

  private updateScore(newScore: number) {
    this.score = newScore
    this.scoreText.setText(`Score: ${this.score}`)

    // Send score update to server in multiplayer
    if (this.isMultiplayer && this.roomId) {
      socketService.updateScore(this.roomId, this.score)
    }
  }

  public updateOpponentScore(score: number) {
    if (this.opponentScoreText) {
      this.opponentScoreText.setText(`Opponent: ${score}`)
    }
  }

  private checkWordInRealTime() {
    if (!this.currentWord) return

    const padding = 40
    this.duckMap.forEach((duck, duckId) => {
      const wordData = duck.getData('wordData') as WordData
      if (this.currentWord.toLowerCase() === wordData.word.toLowerCase()) {
        this.handleDuckHit(duckId)
        this.currentWord = ''
        this.inputText.setText(`Type here: ${this.currentWord}`)
        this.cursorText.setPosition(padding + this.inputText.width, this.scale.gameSize.height - padding - 30)
      }
    })
  }

  private handleMissedDuck(): void {
    if (!this.gameStarted) return

    this.combo = 0
    this.comboText.setText('Combo: 0')
    this.wordsMissed++
  }

  // Make these methods public for external access
  public handleRemoteDuckSpawn(duckData: DuckData): void {
    if (!this.duckMap.has(duckData.id)) {
      this.spawnDuck(duckData)
    }
  }

  public handleDuckHit(duckId: string, hitByOpponent: boolean = false): void {
    const duck = this.duckMap.get(duckId)
    if (!duck) return

    const wordData = duck.getData('wordData') as WordData

    if (!hitByOpponent) {
      // Calculate score with combo bonus
      const comboBonus = Math.floor(this.combo * 0.5)
      const totalPoints = wordData.points + comboBonus
      this.updateScore(this.score + totalPoints)

      // Update combo
      this.combo++
      this.comboText.setText(`Combo: ${this.combo}`)
      this.wordsHit++

      // Emit hit event in multiplayer
      if (this.isMultiplayer && this.roomId) {
        socketService.emitDuckHit(this.roomId, duckId)
      }
    }

    // Play effects
    this.audioManager.playSound(hitByOpponent ? 'opponent_hit' : 'hit')
    const difficultyColor = parseInt(
      wordGenerator
        .getDifficultyInfo(wordData.difficulty)
        .color.replace('#', ''),
      16
    )

    // Create and sync effects
    if (this.isMultiplayer && this.roomId && !hitByOpponent) {
      // Emit hit effect
      socketService.emitEffect(this.roomId, {
        type: 'hit',
        x: duck.x,
        y: duck.y,
        color: difficultyColor,
      })

      // Emit combo effect if applicable
      if (this.combo > 1) {
        socketService.emitEffect(this.roomId, {
          type: 'combo',
          x: duck.x,
          y: duck.y - 20,
          comboCount: this.combo,
        })
      }

      // Emit score effect
      const totalPoints = wordData.points + Math.floor(this.combo * 0.5)
      socketService.emitEffect(this.roomId, {
        type: 'score',
        x: duck.x,
        y: duck.y - 30,
        value: totalPoints,
        color: difficultyColor,
      })
    }

    // Create local effects
    this.particleManager.createHitEffect(duck.x, duck.y, difficultyColor)

    if (!hitByOpponent && this.combo > 1) {
      this.audioManager.playSound('combo')
      this.particleManager.createComboEffect(duck.x, duck.y - 20, this.combo)
    }

    if (!hitByOpponent) {
      const totalPoints = wordData.points + Math.floor(this.combo * 0.5)
      this.particleManager.createScoreEffect(
        duck.x,
        duck.y - 30,
        totalPoints,
        difficultyColor
      )
    }

    // Remove the duck
    duck.destroy()
    this.duckMap.delete(duckId)
  }

  public updateDifficultyDisplay() {
    console.log('Updating difficulty display to:', this.currentDifficulty)
    const difficultyInfo = wordGenerator.getDifficultyInfo(
      this.currentDifficulty
    )
    this.difficultyText.setText(`Difficulty: ${this.currentDifficulty}`)
    this.difficultyText.setColor(difficultyInfo.color)
  }

  public setDifficulty(difficulty: WordDifficulty) {
    if (!difficulty) {
      console.error('Attempted to set undefined difficulty!')
      return
    }

    console.log('setDifficulty called with:', difficulty)
    this.currentDifficulty = difficulty

    // Create or update difficulty display
    if (!this.difficultyText) {
      this.createDifficultyDisplay()
    } else {
      this.updateDifficultyDisplay()
    }

    console.log('Difficulty set to:', this.currentDifficulty)
  }

  public async startGame(): Promise<void> {
    console.log('[startGame] called. currentDifficulty:', this.currentDifficulty)
    if (!this.currentDifficulty) {
      const errorMessage = 'Cannot start game without difficulty set!'
      this.inputText.setText(errorMessage)
      console.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }

    this.gameStarted = true
    this.gameStartTime = Date.now()
    this.lastDuckSpawnTime = this.gameStartTime

    // Start the game loop
    this.time.addEvent({
      delay: 100, // Update every 100ms
      callback: this.gameLoop,
      callbackScope: this,
      loop: true,
    })

    // Initial duck spawn
    console.log('[startGame] Spawning initial duck...')
    this.spawnDuck()

    // Start regular duck spawning
    this.time.addEvent({
      delay: 2000, // Spawn every 2 seconds
      callback: () => {
        if (this.gameStarted) {
          this.spawnDuck()
        }
      },
      loop: true,
    })

    return Promise.resolve()
  }

  private gameLoop() {
    if (!this.gameStarted) return

    const currentTime = Date.now()

    // Update timer only if game is started
    if (this.gameStarted) {
      const elapsedTime = Math.floor((currentTime - this.gameStartTime) / 1000)
      const remainingTime = Math.max(0, this.gameTimer - elapsedTime)
      const minutes = Math.floor(remainingTime / 60)
      const seconds = remainingTime % 60
      this.timerText.setText(
        `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`
      )

      // Change color when time is running low
      if (remainingTime <= 30) {
        this.timerText.setColor('#ff4444')
      } else if (remainingTime <= 60) {
        this.timerText.setColor('#ffaa00')
      }

      // Check for game over
      if (remainingTime <= 0) {
        this.gameOver()
        return
      }
    }

    // Spawn new ducks
    if (currentTime - this.lastDuckSpawnTime >= this.spawnInterval) {
      this.spawnDuck()
      this.lastDuckSpawnTime = currentTime
    }
  }

  private gameOver() {
    if (!this.gameStarted || this.gameEnded) return

    this.gameEnded = true
    this.gameStarted = false

    // Stop spawning ducks and clear existing ones
    this.time.removeAllEvents()
    this.ducks.clear(true, true)
    this.duckMap.clear()

    // Play game over sound
    this.audioManager.playSound('game_over')

    // Update input text and hide cursor
    this.inputText.setText('Game Over!')
    this.cursorText.setVisible(false)

    // Get screen center
    const { width, height } = this.scale.gameSize
    const centerX = width / 2
    const centerY = height / 2

    // Create game over text
    this.add
      .text(centerX, centerY - 50, 'GAME OVER', {
        fontSize: '64px',
        color: '#ff4444',
        fontFamily: 'Orbitron',
      })
      .setOrigin(0.5)

    // Create final score text
    this.add
      .text(centerX, centerY + 20, `Final Score: ${this.score}`, {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Orbitron',
      })
      .setOrigin(0.5)

    if (this.isMultiplayer && this.roomId) {
      // In multiplayer, notify server
      socketService.emitPlayerGameOver(this.roomId)
      // Show waiting message
      this.add.text(centerX, centerY + 80, 'Waiting for other players...', {
        fontSize: '24px',
        color: '#cccccc',
        fontFamily: 'Orbitron',
      }).setOrigin(0.5)

      // Note: The server will emit 'room:gameover' when all players are done
      // which will be handled by the socketService.onRoomGameOver listener
    } else {
      // Single player: allow restart
      this.add
        .text(centerX, centerY + 80, 'Press SPACE to restart', {
          fontSize: '24px',
          color: '#cccccc',
          fontFamily: 'Orbitron',
        })
        .setOrigin(0.5)
      // Add restart functionality
      this.input.keyboard?.on('keydown-SPACE', () => {
        this.scene.restart()
      })
    }
  }

  public handleRemoteEffect(effectData: {
    type: string
    x: number
    y: number
    color?: number
    value?: number
    comboCount?: number
  }): void {
    switch (effectData.type) {
      case 'hit':
        if (effectData.color) {
          this.particleManager.createHitEffect(
            effectData.x,
            effectData.y,
            effectData.color
          )
        }
        break
      case 'combo':
        if (effectData.comboCount) {
          this.particleManager.createComboEffect(
            effectData.x,
            effectData.y,
            effectData.comboCount
          )
        }
        break
      case 'score':
        if (effectData.value && effectData.color) {
          this.particleManager.createScoreEffect(
            effectData.x,
            effectData.y,
            effectData.value,
            effectData.color
          )
        }
        break
    }
  }

  public handleConnectionState(isConnected: boolean): void {
    const statusText = this.add
      .text(
        (this.game.config.width as number) - 20,
        20,
        isConnected ? '🟢 Connected' : '🔴 Disconnected',
        {
          fontSize: '16px',
          color: isConnected ? '#4ade80' : '#ef4444',
          fontFamily: 'Orbitron',
        }
      )
      .setOrigin(1, 0)

    // Fade out after 3 seconds
    this.tweens.add({
      targets: statusText,
      alpha: 0,
      duration: 1000,
      delay: 2000,
      onComplete: () => statusText.destroy(),
    })
  }

  public showError(error: string): void {
    const errorText = this.add
      .text((this.game.config.width as number) / 2, 20, `⚠️ ${error}`, {
        fontSize: '16px',
        color: '#ef4444',
        fontFamily: 'Orbitron',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5, 0)

    // Fade out after 5 seconds
    this.tweens.add({
      targets: errorText,
      alpha: 0,
      duration: 1000,
      delay: 4000,
      onComplete: () => errorText.destroy(),
    })
  }

  /**
   * Returns player stats for leaderboard: score, wordsHit, wordsMissed, accuracy
   */
  public getPlayerStats() {
    const total = this.wordsHit + this.wordsMissed
    const accuracy = total > 0 ? Math.round((this.wordsHit / total) * 100) : 0
    return {
      score: this.score,
      wordsHit: this.wordsHit,
      wordsMissed: this.wordsMissed,
      accuracy,
    }
  }

  destroy() {
    // Clean up resize listener
    this.scale.off('resize', this.handleResize, this)
    
    // Clean up managers
    if (this.audioManager) {
      this.audioManager.destroy()
    }
    if (this.particleManager) {
      this.particleManager.destroy()
    }
    // Clean up multiplayer socket listeners
    if (this.isMultiplayer && this.roomId) {
      socketService.offDuckSpawn()
      socketService.offDuckHit()
      socketService.offOpponentScore()
      socketService.offEffect()
      socketService.offError()
      socketService.offConnectionStateChange()
      socketService.offRoomGameOver()
    }
  }
}
