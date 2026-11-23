import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'

export function PlayerController() {
  const body = useRef<RapierRigidBody>(null)
  const keys = useRef(new Set<string>())
  const direction = useMemo(() => new THREE.Vector3(), [])
  const forward = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const { world, rapier } = useRapier()

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space'].includes(event.code)) event.preventDefault()
      keys.current.add(event.code)
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.code)
    const clear = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])

  useFrame(({ camera }) => {
    const player = body.current
    if (!player) return
    const input = keys.current
    const speed = input.has('ShiftLeft') || input.has('ShiftRight') ? 10.5 : 6.5
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, camera.up).normalize()
    direction.set(0, 0, 0)
    if (input.has('KeyW')) direction.add(forward)
    if (input.has('KeyS')) direction.sub(forward)
    if (input.has('KeyD')) direction.add(right)
    if (input.has('KeyA')) direction.sub(right)
    if (direction.lengthSq() > 0) direction.normalize().multiplyScalar(speed)

    const velocity = player.linvel()
    player.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true)

    const position = player.translation()
    const ray = new rapier.Ray({ x: position.x, y: position.y - 0.78, z: position.z }, { x: 0, y: -1, z: 0 })
    const grounded = world.castRay(ray, 0.18, true, undefined, undefined, undefined, player) !== null
    if (input.has('Space') && grounded && velocity.y < 0.5) {
      player.setLinvel({ x: velocity.x, y: 7, z: velocity.z }, true)
      input.delete('Space')
    }

    camera.position.set(position.x, position.y + 0.48, position.z)
  })

  return <RigidBody ref={body} colliders={false} position={[0, 1.05, 22]} enabledRotations={[false, false, false]} linearDamping={0.15} mass={1}>
    <CapsuleCollider args={[0.52, 0.34]} friction={0} restitution={0} />
  </RigidBody>
}
