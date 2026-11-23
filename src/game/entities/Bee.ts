import Phaser from 'phaser'
import { endlessFlightConfig } from '../config/flightConfig'

export function createBee(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite {
  const width = scene.scale.width
  const height = scene.scale.height
  const bee = scene.physics.add.sprite(width * endlessFlightConfig.beeHorizontalPosition, height * 0.5, 'bee')
    .setDepth(5)
    .setScale(Math.max(0.72, Math.min(1.05, width / 700)))

  bee.setCircle(17, 8, 7)
  bee.setGravityY(endlessFlightConfig.gravity)
  bee.setMaxVelocity(0, endlessFlightConfig.maximumFallVelocity)
  bee.setCollideWorldBounds(false)
  scene.tweens.add({ targets: bee, scaleY: 1.13, duration: 100, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
  return bee
}
