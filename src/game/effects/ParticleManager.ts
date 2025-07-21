import Phaser from 'phaser'

export class ParticleManager {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.initializeParticles()
  }

  private initializeParticles() {
    // Create particle emitters for different effects
    // Note: Emitters are created but not used directly - they serve as templates
    this.createHitParticles()
    this.createExplosionParticles()
    this.createComboParticles()
  }

  private createHitParticles() {
    // Create a simple particle texture for hit effects
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(0xffff00, 1)
    graphics.fillCircle(4, 4, 4)
    graphics.generateTexture('hit_particle', 8, 8)
    graphics.destroy()
  }

  private createExplosionParticles() {
    // Create explosion particle texture
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(0xff4444, 1)
    graphics.fillCircle(6, 6, 6)
    graphics.generateTexture('explosion_particle', 12, 12)
    graphics.destroy()
  }

  private createComboParticles() {
    // Create combo particle texture
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(0x00ffff, 1)
    graphics.fillCircle(3, 3, 3)
    graphics.generateTexture('combo_particle', 6, 6)
    graphics.destroy()
  }

  public createHitEffect(x: number, y: number, color: number = 0xffff00) {
    // Create temporary hit particles
    const hitGraphics = this.scene.add.graphics()
    hitGraphics.fillStyle(color, 1)
    hitGraphics.fillCircle(4, 4, 4)
    hitGraphics.generateTexture('temp_hit_particle', 8, 8)
    hitGraphics.destroy()

    const tempEmitter = this.scene.add.particles(x, y, 'temp_hit_particle', {
      speed: { min: 60, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 8,
      frequency: 50
    })

    // Destroy the temporary emitter after particles are done
    this.scene.time.delayedCall(500, () => {
      tempEmitter.destroy()
    })
  }

  public createExplosionEffect(x: number, y: number, intensity: number = 1) {
    // Create temporary explosion particles
    const explosionGraphics = this.scene.add.graphics()
    explosionGraphics.fillStyle(0xff4444, 1)
    explosionGraphics.fillCircle(6, 6, 6)
    explosionGraphics.generateTexture('temp_explosion_particle', 12, 12)
    explosionGraphics.destroy()

    const tempEmitter = this.scene.add.particles(x, y, 'temp_explosion_particle', {
      speed: { min: 100 * intensity, max: 300 * intensity },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5 * intensity, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 20 * intensity,
      frequency: 50
    })

    // Destroy the temporary emitter after particles are done
    this.scene.time.delayedCall(1000, () => {
      tempEmitter.destroy()
    })
  }

  public createComboEffect(x: number, y: number, comboLevel: number) {
    // Create combo particles with different colors based on combo level
    const colors = [0x00ffff, 0xff00ff, 0xffff00, 0xff8800, 0xff0088]
    const color = colors[Math.min(comboLevel - 1, colors.length - 1)]

    const comboGraphics = this.scene.add.graphics()
    comboGraphics.fillStyle(color, 1)
    comboGraphics.fillCircle(3, 3, 3)
    comboGraphics.generateTexture('temp_combo_particle', 6, 6)
    comboGraphics.destroy()

    const tempEmitter = this.scene.add.particles(x, y, 'temp_combo_particle', {
      speed: { min: 30, max: 80 },
      angle: { min: 270, max: 90 }, // Upward direction
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      quantity: 5 + comboLevel * 2,
      frequency: 200
    })

    // Destroy the temporary emitter after particles are done
    this.scene.time.delayedCall(1200, () => {
      tempEmitter.destroy()
    })
  }

  public createWordEffect(x: number, y: number, word: string, color: number) {
    // Create floating text effect for words
    const text = this.scene.add.text(x, y, word, {
      fontSize: '16px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontFamily: 'Orbitron'
    }).setOrigin(0.5)

    // Animate the text floating up and fading out
    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy()
      }
    })
  }

  public createScoreEffect(x: number, y: number, score: number, color: number) {
    // Create floating score effect
    const scoreText = this.scene.add.text(x, y, `+${score}`, {
      fontSize: '20px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontFamily: 'Orbitron',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5)

    // Animate the score text
    this.scene.tweens.add({
      targets: scoreText,
      y: y - 80,
      scale: 1.5,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        scoreText.destroy()
      }
    })
  }

  public destroy() {
    // Clean up any remaining particle emitters
    // Note: Most emitters are temporary and self-destroy
  }
} 