import Phaser from 'phaser'

export class AudioManager {
  private scene: Phaser.Scene
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map()
  private music?: Phaser.Sound.BaseSound
  private isMuted: boolean = false
  private volume: number = 0.7
  private audioEnabled: boolean = true

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.initializeSounds()
  }

  private initializeSounds() {
    // Create simple sound effects using Phaser's built-in audio
    // Only create sounds if they exist in the cache
    this.createSound('hit')
    this.createSound('combo')
    this.createSound('duck_spawn')
    this.createSound('game_over')
    this.createSound('opponent_hit')
  }

  private createSound(key: string) {
    try {
      // Check if the audio key exists in the cache before creating
      if (this.scene.cache.audio.exists(key)) {
        const sound = this.scene.sound.add(key)
        this.sounds.set(key, sound)
        console.log(`Audio "${key}" loaded successfully`)
      } else {
        console.warn(`Audio "${key}" not found in cache, skipping`)
      }
    } catch (error) {
      console.warn(`Failed to create sound "${key}":`, error)
    }
  }

  public playSound(key: string) {
    if (this.isMuted || !this.audioEnabled) return

    try {
      const sound = this.sounds.get(key)
      if (sound) {
        sound.play({ volume: this.volume })
      } else {
        // Silently ignore missing sounds instead of throwing errors
        console.log(`Sound "${key}" not available`)
      }
    } catch (error) {
      console.warn(`Failed to play sound "${key}":`, error)
    }
  }

  public playMusic() {
    if (this.isMuted || !this.audioEnabled) return

    try {
      if (!this.music && this.scene.cache.audio.exists('background_music')) {
        this.music = this.scene.sound.add('background_music', {
          loop: true,
          volume: this.volume * 0.5,
        })
        this.music.play()
        console.log('Background music started')
      } else if (!this.scene.cache.audio.exists('background_music')) {
        console.log('Background music not available')
      }
    } catch (error) {
      console.warn('Failed to play background music:', error)
    }
  }

  public stopMusic() {
    try {
      if (this.music) {
        this.music.stop()
        this.music = undefined
      }
    } catch (error) {
      console.warn('Failed to stop music:', error)
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted
    if (this.isMuted) {
      this.stopMusic()
    } else {
      this.playMusic()
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    try {
      if (this.music) {
        ;(this.music as any).setVolume(this.volume * 0.5)
      }
    } catch (error) {
      console.warn('Failed to set volume:', error)
    }
  }

  public destroy() {
    try {
      this.stopMusic()
      this.sounds.clear()
    } catch (error) {
      console.warn('Failed to destroy audio manager:', error)
    }
  }

  public setAudioEnabled(enabled: boolean) {
    this.audioEnabled = enabled
    if (!enabled) {
      this.stopMusic()
    }
  }
}
