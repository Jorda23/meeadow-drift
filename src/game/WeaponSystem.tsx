import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from './gameStore'

type Shot = { start: [number, number, number]; end: [number, number, number]; impact: [number, number, number] | null; id: number }

function RifleModel({ group, visible }: { group: MutableRefObject<THREE.Group | null>; visible: boolean }) {
  return <group ref={group} visible={visible} position={[0.36, -0.3, -0.62]} rotation={[0.02, -0.025, 0]}>
    {/* Long, bolt-action chassis and free-floating barrel */}
    <mesh position={[0, -0.015, 0]} castShadow userData={{ weapon: true }}><boxGeometry args={[0.2, 0.22, 0.52]} /><meshStandardMaterial color="#343a34" metalness={0.28} roughness={0.66} /></mesh>
    <mesh position={[0, -0.01, -0.56]} castShadow userData={{ weapon: true }}><boxGeometry args={[0.145, 0.16, 0.78]} /><meshStandardMaterial color="#41483d" roughness={0.82} /></mesh>
    <mesh position={[0, -0.03, 0.46]} castShadow userData={{ weapon: true }}><boxGeometry args={[0.15, 0.18, 0.76]} /><meshStandardMaterial color="#393d35" roughness={0.92} /></mesh>
    <mesh position={[0.015, -0.22, 0.06]} rotation={[-0.22, 0, 0]} castShadow userData={{ weapon: true }}><boxGeometry args={[0.12, 0.32, 0.15]} /><meshStandardMaterial color="#242a25" roughness={0.94} /></mesh>
    <mesh position={[0, -0.25, -0.2]} rotation={[-0.18, 0, 0]} castShadow userData={{ weapon: true }}><boxGeometry args={[0.14, 0.34, 0.2]} /><meshStandardMaterial color="#252b26" roughness={0.9} /></mesh>
    <mesh position={[0, 0.005, -1.34]} rotation={[Math.PI / 2, 0, 0]} castShadow userData={{ weapon: true }}><cylinderGeometry args={[0.032, 0.046, 1.62, 14]} /><meshStandardMaterial color="#252a27" metalness={0.58} roughness={0.38} /></mesh>
    <mesh position={[0, 0.005, -2.17]} rotation={[Math.PI / 2, 0, 0]} castShadow userData={{ weapon: true }}><cylinderGeometry args={[0.06, 0.055, 0.16, 14]} /><meshStandardMaterial color="#747568" metalness={0.65} roughness={0.36} /></mesh>
    {/* Bolt handle, magazine floor plate and cheek rest */}
    <mesh position={[0.115, 0.02, 0.04]} rotation={[0, 0, Math.PI / 2]} userData={{ weapon: true }}><cylinderGeometry args={[0.025, 0.025, 0.2, 10]} /><meshStandardMaterial color="#96917d" metalness={0.7} roughness={0.3} /></mesh>
    <mesh position={[0.21, 0.02, 0.04]} userData={{ weapon: true }}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color="#282d29" roughness={0.6} /></mesh>
    <mesh position={[0, -0.32, -0.08]} rotation={[-0.1, 0, 0]} castShadow userData={{ weapon: true }}><boxGeometry args={[0.11, 0.32, 0.17]} /><meshStandardMaterial color="#222824" roughness={0.82} /></mesh>
    <mesh position={[0, 0.12, -0.22]} userData={{ weapon: true }}><boxGeometry args={[0.16, 0.045, 0.62]} /><meshStandardMaterial color="#222724" metalness={0.55} roughness={0.48} /></mesh>
    {/* High-power optical scope with front and rear glass */}
    <mesh position={[0, 0.25, -0.18]} castShadow userData={{ weapon: true }}><boxGeometry args={[0.14, 0.16, 0.22]} /><meshStandardMaterial color="#303631" roughness={0.48} /></mesh>
    <mesh position={[0, 0.35, -0.18]} rotation={[Math.PI / 2, 0, 0]} userData={{ weapon: true }}><cylinderGeometry args={[0.086, 0.086, 0.5, 20]} /><meshStandardMaterial color="#161c1a" metalness={0.58} roughness={0.24} /></mesh>
    <mesh position={[0, 0.35, 0.075]} rotation={[Math.PI / 2, 0, 0]} userData={{ weapon: true }}><torusGeometry args={[0.096, 0.018, 8, 20]} /><meshStandardMaterial color="#343b37" metalness={0.55} roughness={0.26} /></mesh>
    <mesh position={[0, 0.35, 0.08]} rotation={[Math.PI / 2, 0, 0]} userData={{ weapon: true }}><cylinderGeometry args={[0.075, 0.075, 0.012, 20]} /><meshBasicMaterial color="#8db6c2" transparent opacity={0.11} depthWrite={false} /></mesh>
    <mesh position={[0, 0.35, -0.43]} rotation={[Math.PI / 2, 0, 0]} userData={{ weapon: true }}><torusGeometry args={[0.099, 0.02, 8, 20]} /><meshStandardMaterial color="#343b37" metalness={0.55} roughness={0.26} /></mesh>
    <mesh position={[0, 0.35, -0.43]} userData={{ weapon: true }}><boxGeometry args={[0.1, 0.09, 0.11]} /><meshStandardMaterial color="#262d29" roughness={0.48} /></mesh>
    <mesh position={[0, -0.015, -2.17]} userData={{ weapon: true }}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#ffc45b" transparent opacity={0} /></mesh>
  </group>
}

function MuzzleFlash({ weapon, visible }: { weapon: THREE.Group | null; visible: boolean }) {
  const light = useRef<THREE.PointLight>(null)
  const flare = useRef<THREE.Mesh>(null)
  const barrelTurn = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), [])
  useFrame(() => {
    if (!weapon || !light.current || !flare.current) return
    const point = weapon.localToWorld(new THREE.Vector3(0, 0.005, -2.17))
    light.current.position.copy(point)
    flare.current.position.copy(point)
    flare.current.quaternion.copy(weapon.quaternion).multiply(barrelTurn)
    light.current.intensity = visible ? 4.5 : 0
    flare.current.visible = visible
  })
  return <>
    <pointLight ref={light} color="#ffb64d" intensity={0} distance={5} decay={2} />
    <mesh ref={flare} visible={false} userData={{ weapon: true }}><coneGeometry args={[0.075, 0.32, 8]} /><meshBasicMaterial color="#ffe6a1" /></mesh>
  </>
}

export function WeaponSystem({ active, visible, aiming }: { active: boolean; visible: boolean; aiming: boolean }) {
  const { camera, scene } = useThree()
  const weapon = useRef<THREE.Group>(null)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const center = useMemo(() => new THREE.Vector2(0, 0), [])
  const viewOffset = useMemo(() => new THREE.Vector3(), [])
  const worldPosition = useMemo(() => new THREE.Vector3(), [])
  const viewRotation = useMemo(() => new THREE.Quaternion(), [])
  const weaponRotation = useMemo(() => new THREE.Quaternion(), [])
  const localWeaponRotation = useMemo(() => new THREE.Quaternion(), [])
  const localWeaponEuler = useMemo(() => new THREE.Euler(), [])
  const cooldown = useRef(0)
  const recoil = useRef(0)
  const aimBlend = useRef(0)
  const [flash, setFlash] = useState(false)
  const [shot, setShot] = useState<Shot | null>(null)
  const fire = useGameStore((state) => state.fire)
  const reload = useGameStore((state) => state.reload)
  const damageEnemy = useGameStore((state) => state.damageEnemy)
  const confirmHit = useGameStore((state) => state.confirmHit)
  const clearHitConfirm = useGameStore((state) => state.clearHitConfirm)

  const shoot = useCallback(() => {
    if (!fire()) return
    raycaster.setFromCamera(center, camera)
    const hits = raycaster.intersectObjects(scene.children, true)
    const hit = hits.find((entry) => !entry.object.userData.weapon)
    const end = hit?.point ?? raycaster.ray.at(90, new THREE.Vector3())
    const start = camera.localToWorld(new THREE.Vector3(0.12, -0.3, -2.65))
    let target = hit?.object ?? null
    while (target && target.userData.enemyId === undefined) target = target.parent
    const enemyId = target?.userData.enemyId as string | undefined
    if (enemyId) {
      const result = damageEnemy(enemyId, 120)
      if (result.hit) {
        confirmHit(result.killed)
        window.setTimeout(clearHitConfirm, 480)
      }
    }
    const shotId = performance.now()
    setShot({ start: start.toArray() as [number, number, number], end: end.toArray() as [number, number, number], impact: hit ? hit.point.toArray() as [number, number, number] : null, id: shotId })
    setFlash(true)
    recoil.current = 1
    window.setTimeout(() => setFlash(false), 110)
    window.setTimeout(() => setShot((current) => current?.id === shotId ? null : current), 420)
  }, [camera, center, clearHitConfirm, confirmHit, damageEnemy, fire, raycaster, scene])

  useEffect(() => {
    if (!active) return
    const down = (event: MouseEvent) => {
      if (event.button !== 0 || !document.pointerLockElement || cooldown.current > 0) return
      shoot()
      cooldown.current = 0.82
    }
    const key = (event: KeyboardEvent) => { if (event.code === 'KeyR' && !event.repeat) reload() }
    window.addEventListener('mousedown', down)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('mousedown', down)
      window.removeEventListener('keydown', key)
    }
  }, [active, reload, shoot])

  useFrame((_, delta) => {
    if (!visible) return
    cooldown.current -= delta
    recoil.current = THREE.MathUtils.damp(recoil.current, 0, 13, delta)
    aimBlend.current = THREE.MathUtils.damp(aimBlend.current, aiming ? 1 : 0, 13, delta)
    if (camera instanceof THREE.PerspectiveCamera) {
      const nextFov = THREE.MathUtils.damp(camera.fov, aiming ? 25 : 72, 8, delta)
      if (Math.abs(nextFov - camera.fov) > 0.01) {
        camera.fov = nextFov
        camera.updateProjectionMatrix()
      }
    }
    if (weapon.current) {
      camera.updateMatrixWorld()
      camera.getWorldPosition(worldPosition)
      camera.getWorldQuaternion(viewRotation)
      const aim = aimBlend.current
      viewOffset.set(THREE.MathUtils.lerp(0.2, 0, aim), THREE.MathUtils.lerp(-0.44, -0.32, aim), THREE.MathUtils.lerp(-0.68, -0.54, aim) + recoil.current * 0.22).applyQuaternion(viewRotation)
      weapon.current.position.copy(worldPosition).add(viewOffset)
      localWeaponEuler.set(0.055 - recoil.current * 0.12, -0.025, 0)
      localWeaponRotation.setFromEuler(localWeaponEuler)
      weaponRotation.copy(viewRotation).multiply(localWeaponRotation)
      weapon.current.quaternion.copy(weaponRotation)
    }
  })

  if (!visible) return null
  return <>
    <RifleModel group={weapon} visible={!aiming} />
    <MuzzleFlash weapon={weapon.current} visible={flash} />
    {shot && <>
      <Line points={[shot.start, shot.end]} color="#ffe2a0" transparent opacity={0.9} lineWidth={2} />
      {shot.impact && <group position={shot.impact}>
        <pointLight color="#ff9f3d" intensity={2.2} distance={2.4} decay={2} />
        <mesh><sphereGeometry args={[0.085, 8, 8]} /><meshBasicMaterial color="#ffd58a" /></mesh>
      </group>}
    </>}
  </>
}
