import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { FlightScene } from './game/FlightScene'
import './game/game.css'

type Mode='menu'|'playing'|'paused'|'gameover'
type Hud={distance:number;score:number;speed:number}
const readBestScore=()=>{try{return Number(localStorage.getItem('bee-flight-best')||0)}catch{return 0}}

export default function App(){
  const host=useRef<HTMLDivElement>(null),game=useRef<Phaser.Game|null>(null)
  const scene=useRef<FlightScene|null>(null),ready=useRef(false),pendingStart=useRef(false)
  const [mode,setMode]=useState<Mode>('menu'),[hud,setHud]=useState<Hud>({distance:0,score:0,speed:165}),[bestScore,setBestScore]=useState(readBestScore)
  useEffect(()=>{if(!host.current)return;const flight=new FlightScene();scene.current=flight
    const viewportWidth=window.visualViewport?.width??window.innerWidth,viewportHeight=window.visualViewport?.height??window.innerHeight
    const mobile=viewportWidth<=600||(viewportHeight<=520&&viewportWidth>viewportHeight)
    const instance=new Phaser.Game({type:Phaser.AUTO,parent:host.current,width:mobile?Math.round(viewportWidth):960,height:mobile?Math.round(viewportHeight):540,backgroundColor:'#7ecb63',transparent:false,physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:[flight]});game.current=instance
    instance.events.once('flight-ready',()=>{ready.current=true;if(pendingStart.current){pendingStart.current=false;instance.scene.start('flight',{autostart:true})}})
    instance.events.on('flight-hud',(data:Hud)=>setHud(data));instance.events.on('flight-gameover',(data:Hud)=>{setHud(data);setBestScore(previous=>{const best=Math.max(previous,data.score);try{localStorage.setItem('bee-flight-best',String(best))}catch{}return best});setMode('gameover')})
    return()=>{instance.destroy(true);game.current=null;scene.current=null;ready.current=false;pendingStart.current=false}
  },[])
  const start=()=>{setHud({distance:0,score:0,speed:165});setMode('playing');if(ready.current)game.current?.scene.start('flight',{autostart:true});else pendingStart.current=true}
  const pause=()=>{if(mode==='playing'){setMode('paused');scene.current?.setFlightPaused(true)}else if(mode==='paused'){setMode('playing');scene.current?.setFlightPaused(false)}}
  return <main className="storybook-app flight-app">
    <section className="flight-layout"><div className="flight-stage">
      <div className="phaser-frame"><div className="phaser-mount" ref={host}/>
        <div className="flight-hud compact-hud"><div className="hud-score"><span>DISTANCIA</span><b>{hud.distance} m</b></div><div className="hud-score accent"><span>OBSTÁCULOS</span><b>{hud.score}</b></div><button className="hud-pause" onClick={pause} aria-label={mode==='paused'?'Reanudar vuelo':'Pausar vuelo'}>{mode==='paused'?'▶':'Ⅱ'}</button></div>
        {mode==='menu'&&<div className="flight-overlay"><span className="overlay-flower">✿</span><h2>El jardín despierta</h2><p>Mantén pulsado, haz clic o toca para que la abeja vuele entre las flores.</p><button onClick={start}>EMPEZAR <i>›</i></button></div>}
        {mode==='paused'&&<div className="flight-overlay compact"><span className="overlay-flower">☁</span><h2>Pausa</h2><p>La abeja se toma un respiro.</p><button onClick={pause}>SEGUIR <i>›</i></button></div>}
        {mode==='gameover'&&<div className="flight-overlay compact"><span className="overlay-flower">✿</span><h2>Fin del vuelo</h2><p>Superaste {hud.score} obstáculos y recorriste {hud.distance} m.<br/>Mejor marca: {bestScore} obstáculos</p><button onClick={start}>VOLAR DE NUEVO <i>↻</i></button></div>}
        <div className="flight-controls minimal-controls"><span className="desktop-control-text">ESPACIO O RATÓN PARA VOLAR</span><span className="mobile-control-text">MANTÉN PULSADO PARA VOLAR</span><div><button onClick={start} aria-label="Reiniciar vuelo">↻ <i>REINICIAR</i></button></div></div>
      </div>
    </div></section>
  </main>
}
