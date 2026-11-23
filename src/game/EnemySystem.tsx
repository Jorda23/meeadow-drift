import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from './gameStore'

type EnemyDefinition = { id: string; name: string; position: [number, number, number]; patrol: number }
const enemies: EnemyDefinition[] = [
  { id: 'ridge', name: 'RIFLEMAN', position: [0, 0, 1], patrol: 0.22 },
  { id: 'crossing', name: 'SCOUT', position: [-2.5, 0, -15], patrol: 0.65 },
  { id: 'truck', name: 'GUARD', position: [2.5, 0, -28], patrol: 0.48 },
  { id: 'overlook', name: 'RIFLEMAN', position: [13.5, 0, -40], patrol: 0.65 },
  { id: 'village', name: 'SCOUT', position: [-21, 0, -37], patrol: 0.8 },
]

function Soldier({ enemy }: { enemy: EnemyDefinition }) {
  const root = useRef<THREE.Group>(null)
  const health = useGameStore((state) => state.enemies[enemy.id] ?? 0)
  const dead = health <= 0

  useFrame(({ clock }, delta) => {
    const model = root.current
    if (!model) return
    if (dead) {
      model.rotation.z = THREE.MathUtils.damp(model.rotation.z, -1.25, 4.5, delta)
      model.position.y = THREE.MathUtils.damp(model.position.y, -0.48, 3.5, delta)
      return
    }
    model.position.x = enemy.position[0] + Math.sin(clock.elapsedTime * 0.48 + enemy.position[2]) * enemy.patrol
    model.rotation.y = Math.sin(clock.elapsedTime * 0.35 + enemy.position[0]) * 0.12
  })

  const hit = { enemyId: enemy.id }
  return <group ref={root} position={enemy.position}>
    {!dead && <Html position={[0, 2.3, 0]} center distanceFactor={22} style={{ pointerEvents: 'none' }}>
      <div className="enemy-marker"><i />{enemy.name}</div>
    </Html>}
    {/* Field uniform and plate carrier */}
    <mesh position={[0, 1.12, 0]} castShadow userData={hit}><capsuleGeometry args={[0.25, 0.5, 5, 10]} /><meshStandardMaterial color="#4b5140" roughness={0.96} /></mesh>
    <mesh position={[0, 1.2, 0.16]} castShadow userData={hit}><boxGeometry args={[0.43, 0.46, 0.16]} /><meshStandardMaterial color="#353c32" roughness={0.88} /></mesh>
    <mesh position={[0, 1.2, 0.25]} userData={hit}><boxGeometry args={[0.2, 0.2, 0.035]} /><meshStandardMaterial color="#5e674d" roughness={1} /></mesh>
    <mesh position={[0, 1.53, 0.03]} castShadow userData={hit}><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color="#9a876f" roughness={0.95} /></mesh>
    <mesh position={[0, 1.69, 0.02]} castShadow userData={hit}><sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58]} /><meshStandardMaterial color="#43483c" roughness={0.92} /></mesh>
    <mesh position={[0, 1.62, 0.18]} userData={hit}><boxGeometry args={[0.46, 0.07, 0.34]} /><meshStandardMaterial color="#363c32" roughness={0.9} /></mesh>
    <mesh position={[0, 1.54, 0.2]} userData={hit}><boxGeometry args={[0.08, 0.12, 0.05]} /><meshStandardMaterial color="#171c1a" roughness={0.4} /></mesh>
    {/* Arms and gloves */}
    {[-1, 1].map((side) => <group key={side}>
      <mesh position={[side * 0.34, 1.18, 0.05]} rotation={[0, 0, side * -0.2]} castShadow userData={hit}><capsuleGeometry args={[0.095, 0.37, 4, 8]} /><meshStandardMaterial color="#555a45" roughness={1} /></mesh>
      <mesh position={[side * 0.25, 0.96, 0.25]} castShadow userData={hit}><sphereGeometry args={[0.09, 8, 7]} /><meshStandardMaterial color="#3e4138" roughness={1} /></mesh>
      <mesh position={[side * 0.14, 0.55, 0]} castShadow userData={hit}><capsuleGeometry args={[0.115, 0.42, 4, 8]} /><meshStandardMaterial color="#5b5846" roughness={1} /></mesh>
      <mesh position={[side * 0.14, 0.18, 0.04]} castShadow userData={hit}><boxGeometry args={[0.25, 0.18, 0.38]} /><meshStandardMaterial color="#292e29" roughness={0.94} /></mesh>
    </group>)}
    <mesh position={[0, 1.31, 0.38]} rotation={[0.12, Math.PI, 0]} castShadow userData={hit}>
      <boxGeometry args={[0.12, 0.12, 0.68]} /><meshStandardMaterial color="#202521" metalness={0.35} roughness={0.65} />
    </mesh>
    <mesh position={[0, 1.34, 0.73]} rotation={[Math.PI / 2, 0, 0]} userData={hit}><cylinderGeometry args={[0.025, 0.025, 0.42, 8]} /><meshStandardMaterial color="#202521" metalness={0.55} /></mesh>
    {!dead && <mesh position={[0, 1.77, 0.38]} userData={hit}><boxGeometry args={[0.1, 0.09, 0.14]} /><meshStandardMaterial color="#202521" roughness={0.5} /></mesh>}
  </group>
}

export function EnemySystem() {
  return <group>{enemies.map((enemy) => <Soldier key={enemy.id} enemy={enemy} />)}</group>
}
