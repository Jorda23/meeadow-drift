import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

type SurfaceName = 'plaster' | 'steel' | 'soil' | 'wood' | 'asphalt'
type Surface = { color: THREE.CanvasTexture; normal: THREE.CanvasTexture; roughness: THREE.CanvasTexture }
type SurfaceSet = Record<SurfaceName, Surface>
const SurfaceContext = createContext<SurfaceSet | null>(null)

function makeSurface(base: string, seed: number, repeat: [number, number], style: 'grain' | 'seams' | 'ground') {
  const size = 256
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = colorCanvas.height = size
  const ctx = colorCanvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  let value = seed >>> 0
  const random = () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296 }
  for (let i = 0; i < (style === 'ground' ? 7000 : 5200); i++) {
    const light = random() > 0.53
    const alpha = style === 'ground' ? 0.025 + random() * 0.19 : 0.018 + random() * 0.1
    ctx.fillStyle = light ? `rgba(228,224,208,${alpha})` : `rgba(22,25,22,${alpha})`
    const w = 1 + random() * (style === 'ground' ? 8 : 4)
    const h = style === 'grain' ? 1 + random() * 8 : 1 + random() * 4
    ctx.fillRect(random() * size, random() * size, w, h)
  }
  if (style === 'seams') {
    ctx.strokeStyle = 'rgba(18,22,21,.25)'; ctx.lineWidth = 3
    for (let x = 64; x < size; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke() }
    ctx.strokeStyle = 'rgba(236,230,211,.13)'; ctx.lineWidth = 2
    for (let y = 0; y < size; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke() }
    ctx.strokeStyle = 'rgba(20,22,20,.22)'; ctx.lineWidth = 1
    for (let i = 0; i < 36; i++) {
      const x = random() * size, y = random() * size
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 24 - 12, y + random() * 70); ctx.stroke()
    }
  } else if (style === 'ground') {
    for (let i = 0; i < 48; i++) {
      const x = random() * size, y = random() * size
      ctx.fillStyle = `rgba(${random() > 0.5 ? '48,45,37' : '182,162,122'},${0.025 + random() * 0.13})`
      ctx.beginPath(); ctx.ellipse(x, y, 2 + random() * 16, 1 + random() * 6, random() * 3, 0, Math.PI * 2); ctx.fill()
    }
  }
  const pixels = ctx.getImageData(0, 0, size, size)
  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = normalCanvas.height = size
  const normalCtx = normalCanvas.getContext('2d')!
  const normalPixels = normalCtx.createImageData(size, size)
  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = roughCanvas.height = size
  const roughCtx = roughCanvas.getContext('2d')!
  const roughPixels = roughCtx.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4
    const l = pixels.data[(y * size + Math.max(0, x - 1)) * 4]
    const r = pixels.data[(y * size + Math.min(size - 1, x + 1)) * 4]
    const u = pixels.data[(Math.max(0, y - 1) * size + x) * 4]
    const d = pixels.data[(Math.min(size - 1, y + 1) * size + x) * 4]
    const strength = style === 'ground' ? 0.35 : 0.52
    normalPixels.data[i] = 128 + (l - r) * strength
    normalPixels.data[i + 1] = 128 + (u - d) * strength
    normalPixels.data[i + 2] = 250
    normalPixels.data[i + 3] = 255
    const grain = pixels.data[i]
    const rough = style === 'seams' ? 162 + (255 - grain) * 0.18 : 215 + (255 - grain) * 0.12
    roughPixels.data[i] = roughPixels.data[i + 1] = roughPixels.data[i + 2] = rough
    roughPixels.data[i + 3] = 255
  }
  normalCtx.putImageData(normalPixels, 0, 0)
  roughCtx.putImageData(roughPixels, 0, 0)
  const color = new THREE.CanvasTexture(colorCanvas)
  color.colorSpace = THREE.SRGBColorSpace
  const normal = new THREE.CanvasTexture(normalCanvas)
  const roughness = new THREE.CanvasTexture(roughCanvas)
  for (const texture of [color, normal, roughness]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat[0], repeat[1])
  }
  return { color, normal, roughness }
}

export function WorldSurfaceProvider({ children }: { children: ReactNode }) {
  const { gl } = useThree()
  const surfaces = useMemo<SurfaceSet>(() => {
    const set: SurfaceSet = {
      plaster: makeSurface('#d0cabb', 18, [1.2, 1.2], 'grain'),
      steel: makeSurface('#c8c7bb', 91, [2.5, 2.5], 'seams'),
      soil: makeSurface('#bdb49c', 173, [23, 23], 'ground'),
      wood: makeSurface('#c2a77e', 231, [1.4, 1.4], 'grain'),
      asphalt: makeSurface('#b3ad9e', 352, [5, 28], 'ground'),
    }
    for (const surface of Object.values(set)) for (const texture of [surface.color, surface.normal, surface.roughness]) texture.anisotropy = gl.capabilities.getMaxAnisotropy()
    return set
  }, [gl])
  return <SurfaceContext.Provider value={surfaces}>{children}</SurfaceContext.Provider>
}

export function SurfaceMaterial({ surface, color = '#ffffff', metalness = 0, roughness = 0.9 }: { surface: SurfaceName; color?: string; metalness?: number; roughness?: number }) {
  const surfaces = useContext(SurfaceContext)
  const normalScale = useMemo(() => new THREE.Vector2(0.26, 0.26), [])
  const material = surfaces?.[surface]
  return <meshStandardMaterial color={color} map={material?.color} normalMap={material?.normal} normalScale={normalScale} roughnessMap={material?.roughness} roughness={roughness} metalness={metalness} />
}

export function SurfaceBox({ position, scale, color = '#ffffff', surface = 'plaster', rotation = [0, 0, 0] }: {
  position: [number, number, number]; scale: [number, number, number]; color?: string; surface?: SurfaceName; rotation?: [number, number, number]
}) {
  return <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow><boxGeometry /><SurfaceMaterial surface={surface} color={color} /></mesh>
}

export function VillageHouse({ position, rotation = 0, variant = 0 }: { position: [number, number, number]; rotation?: number; variant?: number }) {
  const wall = variant % 3 === 0 ? '#aaa28d' : variant % 3 === 1 ? '#938d7d' : '#b0aa98'
  const roof = variant % 2 === 0 ? '#626a68' : '#626052'
  return <group position={position} rotation={[0, rotation, 0]}>
    <SurfaceBox position={[0, 0.14, 0]} scale={[10.6, 0.28, 7.6]} color="#686658" surface="plaster" />
    <SurfaceBox position={[0, 2.45, 0]} scale={[10, 4.62, 7]} color={wall} surface="plaster" />
    <SurfaceBox position={[0, 0.78, 3.58]} scale={[2.1, 1.55, 0.14]} color="#3b3a32" surface="wood" />
    <SurfaceBox position={[0, 0.22, 3.72]} scale={[2.65, 0.32, 0.7]} color="#858174" surface="plaster" />
    <SurfaceBox position={[0, 5.0, 0]} scale={[10.5, 0.28, 7.55]} color="#4e5552" surface="steel" />
    <SurfaceBox position={[-2.48, 5.58, 0]} scale={[5.78, 0.19, 8.05]} color={roof} surface="steel" rotation={[0, 0, 0.32]} />
    <SurfaceBox position={[2.48, 5.58, 0]} scale={[5.78, 0.19, 8.05]} color={roof} surface="steel" rotation={[0, 0, -0.32]} />
    <SurfaceBox position={[0, 6.55, 0]} scale={[0.18, 0.12, 8.2]} color="#464d4b" surface="steel" />
    {[-3.35, 3.35].map((x) => <group key={x}>
      <SurfaceBox position={[x, 2.75, 3.59]} scale={[1.4, 1.16, 0.1]} color="#6f8587" surface="steel" />
      <SurfaceBox position={[x - 0.76, 2.75, 3.67]} scale={[0.12, 1.37, 0.12]} color="#c2b9a3" surface="wood" />
      <SurfaceBox position={[x + 0.76, 2.75, 3.67]} scale={[0.12, 1.37, 0.12]} color="#c2b9a3" surface="wood" />
      <SurfaceBox position={[x, 2.75, 3.68]} scale={[0.1, 1.37, 0.12]} color="#c2b9a3" surface="wood" />
      <SurfaceBox position={[x, 2.75, 3.68]} scale={[1.56, 0.1, 0.12]} color="#c2b9a3" surface="wood" />
      <SurfaceBox position={[x, 2.08, 3.7]} scale={[1.68, 0.14, 0.28]} color="#827a68" surface="plaster" />
    </group>)}
    {[-4.9, 4.9].map((x) => <SurfaceBox key={x} position={[x, 2.4, 3.54]} scale={[0.13, 4.6, 0.18]} color="#766f5e" surface="wood" />)}
    <SurfaceBox position={[-2.55, 0.48, 3.72]} scale={[1.18, 0.14, 0.16]} color="#d0b15d" surface="steel" />
    <SurfaceBox position={[4.55, 1.18, -1.4]} scale={[0.62, 0.74, 0.78]} color="#65675e" surface="steel" />
    <SurfaceBox position={[4.55, 1.58, -1.4]} scale={[0.7, 0.1, 0.86]} color="#3f4541" surface="steel" />
    <SurfaceBox position={[-2.55, 4.97, 3.63]} scale={[0.16, 0.08, 0.13]} color="#f2cf86" surface="steel" />
    <SurfaceBox position={[2.0, 4.42, 3.59]} scale={[1.25, 0.14, 0.12]} color="#88816e" surface="plaster" />
    <SurfaceBox position={[-4.2, 1.75, -3.57]} scale={[1.2, 0.52, 0.12]} color="#4b514b" surface="steel" />
  </group>
}

export function MilitaryTruck({ position, rotation = -0.24 }: { position: [number, number, number]; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <SurfaceBox position={[0, 0.82, 0]} scale={[2.15, 0.38, 5.45]} color="#353b32" surface="steel" />
    <SurfaceBox position={[0, 1.25, 0.2]} scale={[2.3, 0.72, 5]} color="#58614e" surface="steel" />
    <SurfaceBox position={[0, 1.56, -1.67]} scale={[2.18, 0.92, 1.62]} color="#66705c" surface="steel" />
    <SurfaceBox position={[0, 2.08, -0.47]} scale={[2.03, 1.3, 1.58]} color="#58604f" surface="steel" />
    <SurfaceBox position={[0, 2.12, -1.29]} scale={[1.72, 0.72, 0.08]} color="#27343a" surface="steel" />
    <SurfaceBox position={[-0.96, 2.12, -0.47]} scale={[0.08, 0.87, 1.5]} color="#222c2d" surface="steel" />
    <SurfaceBox position={[0.96, 2.12, -0.47]} scale={[0.08, 0.87, 1.5]} color="#222c2d" surface="steel" />
    <SurfaceBox position={[0, 1.74, -0.47]} scale={[2, 0.08, 1.6]} color="#333a34" surface="steel" />
    <SurfaceBox position={[0, 1.45, -2.52]} scale={[2.2, 0.16, 0.22]} color="#292e2b" surface="steel" />
    <SurfaceBox position={[-0.67, 1.5, -2.65]} scale={[0.42, 0.34, 0.1]} color="#d0bb78" surface="steel" />
    <SurfaceBox position={[0.67, 1.5, -2.65]} scale={[0.42, 0.34, 0.1]} color="#d0bb78" surface="steel" />
    <SurfaceBox position={[0, 1.05, -2.67]} scale={[0.88, 0.42, 0.12]} color="#313833" surface="steel" />
    <SurfaceBox position={[0, 1.2, 1.95]} scale={[2.1, 0.8, 1]} color="#59604e" surface="steel" />
    <SurfaceBox position={[0, 1.7, 1.95]} scale={[1.95, 1.15, 0.86]} color="#52594a" surface="steel" />
    {[-1.1, 1.1].map((x) => [-1.78, 1.8].map((z) => <group key={`${x}-${z}`} position={[x, 0.63, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.55, 0.55, 0.34, 24]} /><meshStandardMaterial color="#1e211f" roughness={1} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 0.36, 20]} /><meshStandardMaterial color="#66695e" metalness={0.55} roughness={0.55} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 0.38, 12]} /><meshStandardMaterial color="#252a27" metalness={0.5} /></mesh>
    </group>))}
    {[-1.16, 1.16].map((x) => <SurfaceBox key={x} position={[x, 1.2, 1]} scale={[0.12, 0.9, 0.12]} color="#303630" surface="steel" />)}
    <SurfaceBox position={[0, 2.3, 2.05]} scale={[1.65, 0.12, 0.14]} color="#383e36" surface="steel" />
    <SurfaceBox position={[0, 2.2, 2.4]} scale={[1.8, 0.06, 0.08]} color="#a69872" surface="steel" />
  </group>
}

export function AmmoCrate({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <SurfaceBox position={[0, 0.42, 0]} scale={[1.1, 0.82, 0.82]} color="#736347" surface="wood" />
    <SurfaceBox position={[0, 0.84, 0]} scale={[1.12, 0.07, 0.84]} color="#514735" surface="steel" />
    {[-0.38, 0.38].map((x) => <SurfaceBox key={x} position={[x, 0.43, 0.42]} scale={[0.055, 0.82, 0.04]} color="#b39a62" surface="steel" />)}
    <SurfaceBox position={[0, 0.42, 0.466]} scale={[0.48, 0.16, 0.018]} color="#c4b98d" surface="steel" />
    <SurfaceBox position={[0, 0.42, 0.48]} scale={[0.3, 0.035, 0.02]} color="#363c32" surface="steel" />
    <SurfaceBox position={[-0.36, 0.42, -0.42]} scale={[0.05, 0.45, 0.04]} color="#b39a62" surface="steel" />
    <SurfaceBox position={[0.36, 0.42, -0.42]} scale={[0.05, 0.45, 0.04]} color="#b39a62" surface="steel" />
  </group>
}

export function JerseyBarrier({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <SurfaceBox position={[0, 0.24, 0]} scale={[3.5, 0.48, 1.15]} color="#797a72" surface="plaster" />
    <SurfaceBox position={[0, 0.74, 0]} scale={[3.1, 0.56, 0.86]} color="#85857b" surface="plaster" />
    <SurfaceBox position={[0, 1.19, 0]} scale={[2.3, 0.34, 0.68]} color="#73756d" surface="plaster" />
    <SurfaceBox position={[0, 1.38, 0]} scale={[2.05, 0.08, 0.54]} color="#9b9a8c" surface="plaster" />
    <SurfaceBox position={[0, 0.48, 0.59]} scale={[2.35, 0.16, 0.045]} color="#b7a05d" surface="steel" />
  </group>
}

function makeMountain(peakScale: number, seed: number) {
  const columns = 241, rows = 56, width = 260
  const positions: number[] = [], colors: number[] = [], indices: number[] = []
  const peaks = [-118, -82, -42, 1, 42, 83, 119].map((center, i) => ({ center, height: [55, 72, 48, 88, 62, 82, 52][i] * peakScale, width: [17, 22, 15, 24, 18, 21, 16][i] }))
  const rock = new THREE.Color('#52646c')
  const shadowRock = new THREE.Color('#43565f')
  const snow = new THREE.Color('#e7ecee')
  let rand = seed
  const noise = () => { rand = (rand * 1664525 + 1013904223) >>> 0; return rand / 4294967296 }
  for (let row = 0; row < rows; row++) {
    const t = row / (rows - 1)
    for (let col = 0; col < columns; col++) {
      const x = (col / (columns - 1) - 0.5) * width
      const envelope = peaks.reduce((sum, peak) => sum + peak.height * Math.exp(-((x - peak.center) ** 2) / (2 * peak.width ** 2)), 2)
      const ridgeNoise = (Math.sin(x * 0.29 + seed) * 2.2 + Math.sin(x * 0.81 + seed * 3) * 0.8) * Math.sin(t * Math.PI * 0.72)
      const y = Math.max(-2, t * envelope + ridgeNoise)
      const z = (1 - t) * 30 + Math.sin(x * 0.055 + seed) * 2
      positions.push(x, y, z)
      const color = y > 48 * peakScale ? snow : (noise() > 0.55 ? rock : shadowRock)
      const shade = 0.88 + 0.12 * Math.sin(x * 0.1 + row * 0.04)
      colors.push(color.r * shade, color.g * shade, color.b * shade)
      if (row < rows - 1 && col < columns - 1) {
        const a = row * columns + col, b = a + 1, c = a + columns, d = c + 1
        indices.push(a, b, c, b, d, c)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

export function MountainRange() {
  const foreground = useMemo(() => makeMountain(1, 9), [])
  const middle = useMemo(() => makeMountain(0.72, 27), [])
  return <group>
    <mesh geometry={middle} position={[0, -4, -148]} receiveShadow><meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={foreground} position={[0, -2, -126]} receiveShadow castShadow><meshStandardMaterial vertexColors roughness={0.96} side={THREE.DoubleSide} /></mesh>
  </group>
}

export function TerrainMesh() {
  const surfaces = useContext(SurfaceContext)
  const normalScale = useMemo(() => new THREE.Vector2(0.35, 0.35), [])
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(210, 180, 150, 130)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getY(i)
      const hills = 1.9 * Math.exp(-((x - 42) ** 2 + (z + 20) ** 2) / 520) + 1.55 * Math.exp(-((x + 48) ** 2 + (z + 32) ** 2) / 700)
      const undulation = Math.sin(x * 0.115) * 0.17 + Math.cos(z * 0.09) * 0.18 + Math.sin((x + z) * 0.055) * 0.12
      pos.setZ(i, hills + undulation)
    }
    geo.computeVertexNormals()
    geo.computeBoundingSphere()
    return geo
  }, [])
  return <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow><meshStandardMaterial color="#b9b29e" map={surfaces?.soil.color} normalMap={surfaces?.soil.normal} normalScale={normalScale} roughnessMap={surfaces?.soil.roughness} roughness={0.99} /></mesh>
}

export function FirForest() {
  const rows = useMemo(() => {
    const points: Array<{ x: number; z: number; h: number; r: number }> = []
    let seed = 613
    const random = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296 }
    for (const [baseX, baseZ, count, spread] of [[-38, -15, 14, 10], [38, -24, 15, 12], [-28, -48, 13, 16], [28, -53, 13, 18], [-54, 8, 8, 12], [52, 9, 8, 11]] as const) {
      for (let i = 0; i < count; i++) points.push({ x: baseX + (random() - 0.5) * spread, z: baseZ + (random() - 0.5) * spread * 1.5, h: 6.5 + random() * 7, r: 1.6 + random() * 1.7 })
    }
    return points
  }, [])
  const trunk = useRef<THREE.InstancedMesh>(null)
  const boughs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)]
  useLayoutEffect(() => {
    const object = new THREE.Object3D()
    const colors = ['#31483b', '#3d5947', '#465d4a', '#293e35'].map((c) => new THREE.Color(c))
    rows.forEach((tree, i) => {
      object.position.set(tree.x, tree.h * 0.37, tree.z)
      object.scale.set(0.18 * tree.r * 0.55, tree.h * 0.72, 0.18 * tree.r * 0.55)
      object.rotation.set(0, i * 0.73, 0)
      object.updateMatrix(); trunk.current?.setMatrixAt(i, object.matrix)
      boughs.forEach((ref, layer) => {
        const ratio = 0.31 + layer * 0.17
        const radius = tree.r * (1 - layer * 0.17)
        object.position.set(tree.x, tree.h * ratio, tree.z)
        object.scale.set(radius, tree.h * 0.3, radius)
        object.rotation.set(0, i * 0.41 + layer * 0.6, 0)
        object.updateMatrix()
        ref.current?.setMatrixAt(i, object.matrix)
        ref.current?.setColorAt(i, colors[(i + layer) % colors.length])
      })
    })
    if (trunk.current) trunk.current.instanceMatrix.needsUpdate = true
    boughs.forEach((ref) => { if (ref.current) { ref.current.instanceMatrix.needsUpdate = true; if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true } })
  }, [rows])
  return <group>
    <instancedMesh ref={trunk} args={[undefined, undefined, rows.length]} castShadow><cylinderGeometry args={[0.12, 0.22, 1, 10]} /><meshStandardMaterial color="#665442" roughness={1} /></instancedMesh>
    {boughs.map((ref, i) => <instancedMesh key={i} ref={ref} args={[undefined, undefined, rows.length]} castShadow><coneGeometry args={[1, 1.7, 14, 2]} /><meshStandardMaterial color="#ffffff" roughness={0.98} flatShading /></instancedMesh>)}
  </group>
}

export function RockScatter() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const rocks = useMemo(() => Array.from({ length: 110 }, (_, i) => {
    const x = Math.sin(i * 83.1) * 47
    const z = Math.cos(i * 39.7) * 53
    const size = 0.2 + (i % 7) * 0.095
    return { x, z, size, rotation: (i * 1.17) % Math.PI }
  }).filter(({ x, z }) => Math.abs(x) > 9 || Math.abs(z) > 15), [])
  useLayoutEffect(() => {
    const object = new THREE.Object3D()
    rocks.forEach(({ x, z, size, rotation }, index) => {
      object.position.set(x, size * 0.26, z)
      object.scale.set(size * 1.35, size * 0.72, size)
      object.rotation.set(rotation * 0.12, rotation, rotation * 0.2)
      object.updateMatrix(); mesh.current?.setMatrixAt(index, object.matrix)
      mesh.current?.setColorAt(index, new THREE.Color(index % 3 === 0 ? '#716e62' : '#8e8979'))
    })
    if (mesh.current) { mesh.current.instanceMatrix.needsUpdate = true; if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true }
  }, [rocks])
  return <instancedMesh ref={mesh} args={[undefined, undefined, rocks.length]} castShadow receiveShadow><dodecahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#ffffff" roughness={1} flatShading /></instancedMesh>
}

export function VillageTree({ position, height = 9 }: { position: [number, number, number]; height?: number }) {
  return <group position={position}>
    <mesh position={[0, height * 0.33, 0]} castShadow><cylinderGeometry args={[0.13, 0.3, height * 0.68, 12]} /><meshStandardMaterial color="#62513f" roughness={1} /></mesh>
    <mesh position={[0, height * 0.69, 0]} scale={[1, 1.15, 1]} castShadow><icosahedronGeometry args={[height * 0.29, 2]} /><meshStandardMaterial color="#52654d" roughness={1} flatShading /></mesh>
    <mesh position={[height * 0.14, height * 0.76, 0.16]} scale={[0.65, 0.8, 0.7]} castShadow><icosahedronGeometry args={[height * 0.2, 1]} /><meshStandardMaterial color="#657452" roughness={1} flatShading /></mesh>
  </group>
}

export function VillageLighting() {
  return <>
    <hemisphereLight args={['#dbe9f2', '#343b32', 1.25]} />
    <ambientLight intensity={0.32} color="#c7d3da" />
    <directionalLight position={[-48, 68, 34]} intensity={3.1} color="#fff0d9" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-52} shadow-camera-right={52} shadow-camera-top={52} shadow-camera-bottom={-52} shadow-normalBias={0.035} shadow-bias={-0.0002} />
  </>
}
