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
    const instance=new Phaser.Game({type:Phaser.AUTO,parent:host.current,width:mobile?Math.round(viewportWidth):960,height:mobile?Math.round(viewportHeight):540,backgroundColor:'#8ccf8e',transparent:false,physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:[flight]});game.current=instance
    instance.events.once('flight-ready',()=>{ready.current=true;if(pendingStart.current){pendingStart.current=false;instance.scene.start('flight',{autostart:true})}})
    instance.events.on('flight-hud',(data:Hud)=>setHud(data));instance.events.on('flight-gameover',(data:Hud)=>{setHud(data);setBestScore(previous=>{const best=Math.max(previous,data.score);try{localStorage.setItem('bee-flight-best',String(best))}catch{}return best});setMode('gameover')})
    return()=>{instance.destroy(true);game.current=null;scene.current=null;ready.current=false;pendingStart.current=false}
  },[])
  const start=()=>{setHud({distance:0,score:0,speed:165});setMode('playing');if(ready.current)game.current?.scene.start('flight',{autostart:true});else pendingStart.current=true}
  const pause=()=>{if(mode==='playing'){setMode('paused');scene.current?.setFlightPaused(true)}else if(mode==='paused'){setMode('playing');scene.current?.setFlightPaused(false)}}
  return <main className="storybook-app flight-app"><header className="topline"><a className="wordmark"><span className="tiny-bee">✿</span> LITTLE MEADOW <i>FLIGHT CLUB</i></a><div className="top-actions"><span className="endless-badge">ENDLESS FLIGHT</span></div></header>
    <section className="flight-layout"><div className="flight-stage">
      <div className="flight-topline"><span>✿ &nbsp;THE ENDLESS GARDEN</span><span>FREE FLIGHT &nbsp;·&nbsp; ∞</span></div>
      <div className="phaser-frame"><div className="phaser-mount" ref={host}/>
        <div className="flight-hud"><div className="hud-score"><span>OBSTACLES PASSED</span><b>{String(hud.score).padStart(4,'0')}</b></div><div className="progress-box"><div className="progress-caption"><span>CURRENT STRETCH</span><b>{hud.distance} m</b></div><div className="distance-track"><i style={{width:`${Math.min(100,(hud.distance%500)/5)}%`}}/></div></div><div className="hud-score right"><span>SPEED</span><b>{hud.speed}</b></div></div>
        {mode==='menu'&&<div className="flight-overlay"><span className="overlay-flower">✿</span><h2>Ready to drift?</h2><p>Hold, click, or touch to help your bee find the way.</p><button onClick={start}>▶ &nbsp; START THE FLIGHT <i>›</i></button></div>}
        {mode==='paused'&&<div className="flight-overlay compact"><span className="overlay-flower">☁</span><h2>Taking a breather?</h2><p>Your flight is paused.</p><button onClick={pause}>RESUME THE FLIGHT <i>›</i></button></div>}
        {mode==='gameover'&&<div className="flight-overlay compact"><span className="overlay-flower">✿</span><h2>Flight over!</h2><p>You passed {hud.score} obstacles and flew {hud.distance} meters.<br/>Best run: {bestScore} obstacles</p><button onClick={start}>FLY AGAIN <i>↻</i></button></div>}
        <div className="flight-controls"><span className="desktop-control-text">SPACE OR MOUSE TO FLY UP</span><span className="mobile-control-text">TOUCH AND HOLD TO FLY UP</span><div><button onClick={start} aria-label="Restart flight">↻ <i>RESTART</i></button><button onClick={pause} aria-label={mode==='paused'?'Resume flight':'Pause flight'}>{mode==='paused'?'▶':'Ⅱ'} <i>{mode==='paused'?'RESUME':'PAUSE'}</i></button></div></div>
      </div>
      <div className="flight-tip"><span>☞ &nbsp;TIP: SHORT TAPS MAKE THE SWEETEST TURNS</span><span>NO FINISH LINE · KEEP DRIFTING</span></div>
    </div></section>
  </main>
}
