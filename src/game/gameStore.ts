import { create } from 'zustand'

const MAGAZINE_SIZE = 5
type GameState = {
  magazine: number
  reserve: number
  reloading: boolean
  shotsFired: number
  kills: number
  hitConfirm: boolean
  enemies: Record<string, number>
  fire: () => boolean
  reload: () => void
  damageEnemy: (id: string, damage: number) => { hit: boolean; killed: boolean }
  confirmHit: (killed: boolean) => void
  clearHitConfirm: () => void
}

let reloadTimer: ReturnType<typeof setTimeout> | undefined

export const useGameStore = create<GameState>((set, get) => ({
  magazine: MAGAZINE_SIZE,
  reserve: 30,
  reloading: false,
  shotsFired: 0,
  kills: 0,
  hitConfirm: false,
  enemies: { ridge: 100, crossing: 100, truck: 100, overlook: 100, village: 100 },
  fire: () => {
    const { magazine, reloading } = get()
    if (reloading || magazine <= 0) return false
    set({ magazine: magazine - 1, shotsFired: get().shotsFired + 1 })
    return true
  },
  reload: () => {
    const { magazine, reserve, reloading } = get()
    if (reloading || magazine === MAGAZINE_SIZE || reserve === 0) return
    if (reloadTimer) clearTimeout(reloadTimer)
    set({ reloading: true })
    reloadTimer = setTimeout(() => {
      const current = get()
      const loaded = Math.min(MAGAZINE_SIZE - current.magazine, current.reserve)
      set({ magazine: current.magazine + loaded, reserve: current.reserve - loaded, reloading: false })
      reloadTimer = undefined
    }, 2300)
  },
  damageEnemy: (id, damage) => {
    const enemies = get().enemies
    const health = enemies[id] ?? 0
    if (health <= 0) return { hit: false, killed: false }
    const nextHealth = Math.max(0, health - damage)
    const killed = nextHealth === 0
    set({ enemies: { ...enemies, [id]: nextHealth }, kills: get().kills + (killed ? 1 : 0) })
    return { hit: true, killed }
  },
  confirmHit: () => set({ hitConfirm: true }),
  clearHitConfirm: () => set({ hitConfirm: false }),
}))
