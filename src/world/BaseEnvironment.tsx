import { useMemo } from 'react'
import * as THREE from 'three'
import {
  AmmoCrate,
  FirForest,
  JerseyBarrier,
  MilitaryTruck,
  MountainRange,
  RockScatter,
  SurfaceBox,
  SurfaceMaterial,
  TerrainMesh,
  VillageHouse,
  VillageLighting,
  WorldSurfaceProvider,
  VillageTree,
} from './WorldAssets'
import { EnemySystem } from '../game/EnemySystem'

function SandbagLine({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const bags = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    x: (i % 5 - 2) * 0.82 + (Math.floor(i / 5) % 2) * 0.4,
    y: 0.26 + Math.floor(i / 5) * 0.46,
    z: 0,
    color: i % 3 === 0 ? '#a59675' : '#8f8469',
  })), [])
  return <group position={position} rotation={[0, rotation, 0]}>
    {bags.map((bag, index) => <mesh key={index} position={[bag.x, bag.y, bag.z]} rotation={[0, 0, Math.PI / 2]} scale={[0.78, 1, 0.72]} castShadow receiveShadow>
      <capsuleGeometry args={[0.28, 0.46, 5, 10]} />
      <meshStandardMaterial color={bag.color} roughness={1} />
    </mesh>)}
  </group>
}

function Watchtower({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    {[-1.15, 1.15].map((x) => [-1.15, 1.15].map((z) => <SurfaceBox key={`${x}-${z}`} position={[x, 2.6, z]} scale={[0.18, 5.2, 0.18]} color="#5b5140" surface="wood" />))}
    <SurfaceBox position={[0, 5.2, 0]} scale={[3, 0.22, 3]} color="#4c504a" surface="steel" />
    <SurfaceBox position={[0, 5.78, 0]} scale={[2.75, 0.95, 2.75]} color="#62675d" surface="steel" />
    <SurfaceBox position={[0, 6.12, 1.4]} scale={[1.48, 0.48, 0.08]} color="#26383b" surface="steel" />
    <SurfaceBox position={[0, 6.65, 0]} scale={[3.2, 0.18, 3.2]} color="#434b49" surface="steel" />
    <SurfaceBox position={[0, 6.8, 0]} scale={[3.4, 0.12, 3.4]} color="#65716d" surface="steel" />
    {[-1.4, 1.4].map((x) => <SurfaceBox key={x} position={[x, 5.9, 1.53]} scale={[0.08, 0.85, 0.08]} color="#a0a08c" surface="steel" />)}
  </group>
}

function UtilityPole({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh position={[0, 5.1, 0]} castShadow><cylinderGeometry args={[0.13, 0.24, 10.2, 12]} /><meshStandardMaterial color="#5b4b39" roughness={1} /></mesh>
    <SurfaceBox position={[0, 8.8, 0]} scale={[2.5, 0.17, 0.18]} color="#594936" surface="wood" />
    {[-0.9, 0, 0.9].map((x) => <mesh key={x} position={[x, 8.56, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.34, 10]} /><meshStandardMaterial color="#353c3a" metalness={0.6} roughness={0.5} /></mesh>)}
  </group>
}

function PowerLines() {
  const lines = useMemo(() => [5.05, 5.65, 6.25].map((z) => {
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-35, 8.65, z), new THREE.Vector3(-18, 7.8, z),
      new THREE.Vector3(0, 7.55, z), new THREE.Vector3(18, 7.8, z), new THREE.Vector3(35, 8.65, z),
    ])
    return new THREE.TubeGeometry(path, 54, 0.015, 5, false)
  }), [])
  return <group>{lines.map((geometry, index) => <mesh key={index} geometry={geometry}><meshStandardMaterial color="#272b2b" metalness={0.5} roughness={0.62} /></mesh>)}</group>
}

function Road() {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.021, -10]} receiveShadow>
      <planeGeometry args={[8.4, 88]} />
      <SurfaceMaterial surface="soil" color="#777366" roughness={0.98} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, -10]} receiveShadow>
      <planeGeometry args={[8.2, 86]} />
      <SurfaceMaterial surface="asphalt" color="#615e54" roughness={0.99} />
    </mesh>
    {[-3.62, 3.62].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.008, -10]}>
      <planeGeometry args={[0.08, 84]} /><meshBasicMaterial color="#c3b275" transparent opacity={0.55} />
    </mesh>)}
    {Array.from({ length: 18 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.006, 29 - i * 4.2]}>
      <planeGeometry args={[0.12, 1.35]} /><meshBasicMaterial color="#c1b17d" transparent opacity={0.52} />
    </mesh>)}
  </group>
}

function VillageLayout() {
  return <>
    <VillageLighting />
    <TerrainMesh />
    <Road />

    <VillageHouse position={[-14, 0, -8]} rotation={0.025} variant={0} />
    <VillageHouse position={[13, 0, -12]} rotation={-0.04} variant={1} />
    <VillageHouse position={[-17, 0, -28]} rotation={0.08} variant={2} />
    <VillageHouse position={[19, 0, -30]} rotation={-0.11} variant={0} />

    <Watchtower position={[-34, 0, -20]} />
    <Watchtower position={[35, 0, -25]} />
    <UtilityPole position={[-29, 0, 5]} />
    <UtilityPole position={[16, 0, 6]} />
    <UtilityPole position={[29, 0, 5]} />
    <PowerLines />

    <FirForest />
    <VillageTree position={[-25, 0, -22]} height={10} />
    <VillageTree position={[27, 0, -18]} height={9} />
    <VillageTree position={[-34, 0, -43]} height={12} />
    <VillageTree position={[31, 0, -42]} height={11} />
    <RockScatter />
    <MountainRange />
    <EnemySystem />

    <MilitaryTruck position={[4, 0, -9]} rotation={-0.24} />
    <JerseyBarrier position={[-3.5, 0, 5]} rotation={0.12} />
    <JerseyBarrier position={[6.4, 0, -4]} rotation={-0.2} />
    <JerseyBarrier position={[-9, 0, -17]} rotation={0.55} />
    <SandbagLine position={[-8, 0, 8]} rotation={-0.18} />
    <SandbagLine position={[10, 0, 4]} rotation={1.5} />
    <AmmoCrate position={[-7, 0, 0]} rotation={0.18} />
    <AmmoCrate position={[-7.8, 0, 0.08]} rotation={0.18} />
    <AmmoCrate position={[8.2, 0, -7]} rotation={-0.3} />
    <AmmoCrate position={[8.9, 0.86, -7]} rotation={-0.3} />

    {Array.from({ length: 18 }, (_, i) => <SurfaceBox key={i} position={[-37 + i * 4.5, 0.9 + (i % 4 === 1 ? 0.45 : 0), -48]} scale={[4.25, 1.8 + (i % 4 === 1 ? 0.9 : 0), 0.8]} color={i % 3 === 0 ? '#77766b' : '#888579'} surface="plaster" />)}
  </>
}

export function BaseEnvironment() {
  return <WorldSurfaceProvider><VillageLayout /></WorldSurfaceProvider>
}
