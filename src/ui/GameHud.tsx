import { useEffect, useRef } from 'react'
import { Crosshair, HeartPulse, Map, Shield, Target, Users } from 'lucide-react'
import './gameHud.css'

function Minimap() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const { width, height } = element
    const map = context.createRadialGradient(width / 2, height / 2, 18, width / 2, height / 2, width / 2)
    map.addColorStop(0, '#27352f')
    map.addColorStop(1, '#111a18')
    context.fillStyle = map
    context.fillRect(0, 0, width, height)
    context.save()
    context.beginPath()
    context.arc(width / 2, height / 2, width * 0.46, 0, Math.PI * 2)
    context.clip()
    context.strokeStyle = 'rgba(200,205,187,.1)'
    context.lineWidth = 1
    for (let x = 20; x < width; x += 24) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke() }
    for (let y = 18; y < height; y += 24) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke() }
    context.strokeStyle = '#9a9074'
    context.lineWidth = 10
    context.beginPath(); context.moveTo(-8, 150); context.bezierCurveTo(52, 124, 76, 150, 115, 118); context.bezierCurveTo(150, 88, 170, 91, 228, 42); context.stroke()
    context.strokeStyle = 'rgba(227,219,187,.36)'
    context.lineWidth = 1
    context.setLineDash([3, 5])
    context.beginPath(); context.moveTo(-8, 150); context.bezierCurveTo(52, 124, 76, 150, 115, 118); context.bezierCurveTo(150, 88, 170, 91, 228, 42); context.stroke()
    context.setLineDash([])
    context.fillStyle = 'rgba(177,181,158,.16)'
    ;[[61, 57, 30, 21], [144, 67, 40, 25], [166, 156, 33, 28], [40, 174, 25, 19]].forEach(([x, y, w, h]) => context.fillRect(x, y, w, h))
    context.strokeStyle = 'rgba(227,221,195,.3)'
    context.lineWidth = 1
    ;[[61, 57, 30, 21], [144, 67, 40, 25], [166, 156, 33, 28], [40, 174, 25, 19]].forEach(([x, y, w, h]) => context.strokeRect(x, y, w, h))
    const marker = (x: number, y: number, label: string, color: string) => {
      context.fillStyle = color
      context.beginPath(); context.arc(x, y, 8, 0, Math.PI * 2); context.fill()
      context.fillStyle = '#101513'; context.font = 'bold 8px monospace'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(label, x, y + 0.5)
    }
    marker(144, 77, 'A', '#d88161')
    marker(74, 145, 'B', '#d6bd72')
    marker(185, 145, 'C', '#68a8bb')
    context.fillStyle = '#ec7862'
    ;[[112, 67], [88, 91], [124, 146], [52, 112]].forEach(([x, y]) => {
      context.beginPath(); context.arc(x, y, 3.2, 0, Math.PI * 2); context.fill()
      context.strokeStyle = 'rgba(236,120,98,.55)'; context.lineWidth = 1
      context.beginPath(); context.arc(x, y, 6, 0, Math.PI * 2); context.stroke()
    })
    context.save()
    context.translate(112, 118)
    context.rotate(-0.28)
    context.fillStyle = '#eaf2df'
    context.beginPath(); context.moveTo(0, -10); context.lineTo(7, 8); context.lineTo(0, 5); context.lineTo(-7, 8); context.closePath(); context.fill()
    context.restore()
    context.restore()
  }, [])
  return <canvas ref={canvas} width={220} height={220} className="minimap-canvas" aria-label="Tactical minimap" />
}

export function GameHud({ magazine, reserve, reloading, aiming, kills, hitConfirm }: { magazine: number; reserve: number; reloading: boolean; aiming: boolean; kills: number; hitConfirm: boolean }) {
  return <div className={`combat-hud ${aiming ? 'is-aiming' : ''} ${hitConfirm ? 'hit-confirmed' : ''}`}>
    <div className="hud-top-center">
      <div className="compass-strip"><span>W</span><i /> <span>NW</span><i /> <strong>341</strong><i /> <span>N</span><i /> <span>NE</span><i /> <span>E</span></div>
      <div className="scoreboard">
        <div className="team-score friendly"><small>US</small><strong>{String(6 + kills).padStart(3, '0')}</strong></div>
        <div className="match-progress"><span>CONQUEST</span><div><i /></div><b>200</b></div>
        <div className="team-score hostile"><strong>005</strong><small>RU</small></div>
      </div>
      <div className="objective-row"><span className="objective-chip enemy">A</span><span className="objective-chip active">B <small>CONTESTED</small></span><span className="objective-chip friendly">C</span></div>
    </div>

    <div className="objective-marker"><span className="marker-diamond">B</span><strong>VILLAGE SQUARE</strong><small>OBJECTIVE · 42 M</small></div>

    <div className="kill-feed"><div><b className="feed-blue">RAVEN 2</b><Crosshair size={12} /><b>STALKER</b></div><div><b>GHOST 7</b><Crosshair size={12} /><b className="feed-blue">RAVEN 4</b></div></div>

    {!aiming && <div className="hip-reticle" aria-hidden="true"><i /><i /><i /><i /><b /></div>}
    {aiming && <div className="optic-view" aria-hidden="true"><div className="optic-ring"><i className="optic-cross horizontal" /><i className="optic-cross vertical" /><b /></div></div>}

    <div className="squad-panel">
      <div className="squad-heading"><Users size={13} /><span>ALPHA SQUAD</span><small>3 / 4</small></div>
      {['RAVEN 1', 'RAVEN 2', 'RAVEN 3'].map((name, index) => <div className="squad-member" key={name}><span className="squad-dot">{index + 1}</span><b>{name}</b><div className="squad-health"><i style={{ width: index === 1 ? '68%' : '100%' }} /></div><span className="squad-distance">{index === 0 ? 'YOU' : `${38 + index * 17}M`}</span></div>)}
    </div>

    <div className="minimap-panel"><div className="minimap-heading"><Map size={12} /><span>KESTREL RIDGE</span><small>N</small></div><div className="minimap-wrap"><Minimap /><span className="map-scale">50 M</span></div><div className="map-footer"><span><i className="map-dot blue" /> FRIENDLY</span><span><i className="map-dot amber" /> OBJECTIVE</span></div></div>

    <div className="health-panel"><div className="health-title"><HeartPulse size={15} /><span>VITALITY</span><strong>100</strong></div><div className="health-track"><i /></div><div className="armor-title"><Shield size={13} /><span>ARMOR</span><strong>75</strong></div><div className="health-track armor"><i /></div></div>

    <div className="weapon-panel"><div className="weapon-class"><span>PRIMARY WEAPON</span><i>1</i></div><div className="weapon-name">M24 <small>SNIPER</small></div><div className="weapon-ammo"><strong>{reloading ? '···' : String(magazine).padStart(2, '0')}</strong><span>/ {String(reserve).padStart(3, '0')}</span><div className="ammo-icon"><Target size={15} /></div></div><div className="weapon-state">{reloading ? 'RELOADING' : aiming ? 'OPTIC · 4×' : '7.62 × 51 MM NATO'}</div><div className="weapon-slots"><span>2&nbsp; PISTOL</span><span>G&nbsp; GRENADE</span></div></div>

    <div className="hud-controls"><kbd>WASD</kbd> MOVE <kbd>SHIFT</kbd> SPRINT <kbd>SPACE</kbd> VAULT <kbd>RMB</kbd> AIM <kbd>LMB</kbd> FIRE <kbd>R</kbd> RELOAD</div>
  </div>
}
