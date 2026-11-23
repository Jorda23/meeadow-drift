import Phaser from 'phaser'
import { endlessFlightConfig } from '../config/flightConfig'

export function spawnObstaclePattern(
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.Group,
  scenery: Phaser.GameObjects.Group,
  x: number,
  travelled: number,
  patternIndex: number,
  height: number,
) {
  const difficulty = Math.min(4, Math.floor(travelled / endlessFlightConfig.difficultyDistance))
  const swing = 58 + difficulty * 11
  const gap = Math.max(endlessFlightConfig.minimumGap, Math.min(endlessFlightConfig.initialGap, height * 0.56) - difficulty * endlessFlightConfig.gapReductionPerStep)
  const center = Phaser.Math.Clamp(height / 2 + Math.sin(x * 0.0063 + patternIndex * 0.72) * swing + Math.sin(x * 0.002) * 45, 35 + gap / 2, height - 35 - gap / 2)
  const topHeight = center - gap / 2
  const bottomY = center + gap / 2
  const topTexture = patternIndex % 2 === 0 ? 'barrier-green' : 'barrier-wood'
  const bottomTexture = patternIndex % 2 === 0 ? 'barrier-wood' : 'barrier-green'
  const top = obstacles.create(x, topHeight / 2, topTexture) as Phaser.Physics.Arcade.Image
  top.setDisplaySize(66, topHeight + 12).setOrigin(0.5).refreshBody().setData('kind', 'branch').setData('scoreGate', true)

  const bottomHeight = height - bottomY
  const bottom = obstacles.create(x, (bottomY + height) / 2, bottomTexture) as Phaser.Physics.Arcade.Image
  bottom.setDisplaySize(66, bottomHeight + 12).setOrigin(0.5).refreshBody().setData('kind', 'branch')

  if (travelled > 2000) {
    scenery.add(scene.add.image(x, topHeight - 12, 'thorn').setDepth(3).setDisplaySize(130, 30))
    scenery.add(scene.add.image(x, bottomY + 12, 'thorn').setDepth(3).setDisplaySize(130, 30))
  }

  if (travelled > 4400 && (difficulty >= 3 || patternIndex % 2 === 0)) {
    const spider = scene.physics.add.image(x + 80, center + (patternIndex % 2 === 0 ? -1 : 1) * gap * 0.25, 'spider').setDepth(4)
    spider.body!.allowGravity = false
    spider.setCircle(11, 9, 7)
    obstacles.add(spider)
    scene.tweens.add({ targets: spider, y: spider.y + Phaser.Math.Between(38, 62), duration: difficulty >= 3 ? 720 : 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
  }

  if (difficulty >= 2 && patternIndex % 2 === 1) {
    const rock = scene.physics.add.image(x + 135, center + gap * 0.31, 'rock').setDepth(4).setScale(0.8)
    rock.body!.allowGravity = false
    rock.setCircle(15, 7, 6)
    obstacles.add(rock)
    scene.tweens.add({ targets: rock, y: rock.y - 24, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
  }

  if (difficulty >= 3 && patternIndex % 3 === 2) {
    const rock = scene.physics.add.image(x + 190, center - gap * 0.3, 'rock').setDepth(4).setScale(0.7)
    rock.body!.allowGravity = false
    rock.setCircle(13, 7, 6)
    obstacles.add(rock)
    scene.tweens.add({ targets: rock, y: rock.y + 30, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
  }
}
