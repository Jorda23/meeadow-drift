import Phaser from 'phaser'
import { createBee } from './entities/Bee'
import { endlessFlightConfig } from './config/flightConfig'
import { spawnObstaclePattern } from './systems/ObstacleSpawner'

export class FlightScene extends Phaser.Scene {
  private bee!:Phaser.Physics.Arcade.Sprite
  private held=false
  private travelled=0
  private score=0
  private nextPattern=endlessFlightConfig.firstPatternDistance
  private obstacles!:Phaser.Physics.Arcade.Group
  private scenery!:Phaser.GameObjects.Group
  private parallax!:Phaser.GameObjects.Group
  private hudClock=0
  private ended=false
  private patternIndex=0
  private autostart=false
  constructor(){super('flight')}
  init(data:{autostart?:boolean}={}){this.autostart=data.autostart??false;this.travelled=0;this.score=0;this.nextPattern=endlessFlightConfig.firstPatternDistance;this.patternIndex=0;this.ended=false;this.held=false}
  create(){
    this.makeTextures();this.paintBackdrop()
    this.scenery=this.add.group();this.parallax=this.add.group();this.obstacles=this.physics.add.group({allowGravity:false,immovable:true})
    const width=this.scale.width,height=this.scale.height
    for(let i=0;i<5;i++){const cloud=this.add.image(width*(.08+i*.21),height*(.14+(i%3)*.1),'cloud').setDepth(0).setScale(.65+(i%3)*.12).setAlpha(.68);this.parallax.add(cloud)}
    this.bee=createBee(this)
    this.input.on('pointerdown',()=>this.held=true);this.input.on('pointerup',()=>this.held=false);this.input.keyboard?.on('keydown-SPACE',()=>this.held=true);this.input.keyboard?.on('keyup-SPACE',()=>this.held=false);this.input.keyboard?.on('keydown-UP',()=>this.held=true);this.input.keyboard?.on('keyup-UP',()=>this.held=false)
    this.physics.add.overlap(this.bee,this.obstacles,()=>this.finish())
    this.game.events.emit('flight-hud',{distance:0,score:0,speed:endlessFlightConfig.initialSpeed})
    // Keep the scene still under the start screen, even if the UI listener attaches late.
    if(!this.autostart)this.scene.pause()
    this.game.events.emit('flight-ready')
  }
  private paintBackdrop(){
    // Cover the viewport without stretching the illustrated landscape on portrait phones.
    const coverScale=Math.max(this.scale.width/960,this.scale.height/540)
    const g=this.add.graphics().setDepth(-5).setScale(coverScale).setPosition((this.scale.width-960*coverScale)/2,(this.scale.height-540*coverScale)/2)
    g.fillGradientStyle(0xdcebd3,0xe2efd9,0xb7d6b3,0xc5dfbd,1);g.fillRect(0,0,960,540)
    // One static, low-detail landscape keeps the playfield clear and avoids rebuilding worlds.
    g.fillStyle(0xb7d6b3,.58);g.fillEllipse(130,286,540,184);g.fillEllipse(620,274,650,190)
    g.fillStyle(0xc5dfbd,.72);g.fillEllipse(170,355,620,130);g.fillEllipse(760,345,680,142)
    g.fillStyle(0xb7d6b3,.82);g.fillRect(0,369,960,171)
    g.lineStyle(2,0x829e75,.55);g.lineBetween(0,367,960,367)
    let seed=7241;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
    for(let i=0;i<350;i++){const x=random()*960,y=random()*540;g.fillStyle(i%3===0?0xffffff:0x728b5c,.035+random()*.06);g.fillCircle(x,y,.5+random()*.9)}
    for(let i=0;i<60;i++){const x=random()*960,y=365+random()*175;g.lineStyle(1,random()>.5?0x718d67:0xf4f4d8,.16);g.lineBetween(x,y,x+3+random()*9,y-1-random()*4)}
    g.fillStyle(0xffffff,.42);for(const [x,y] of [[130,88],[430,118],[790,90]]){g.fillEllipse(x,y,68,22);g.fillEllipse(x+19,y-9,42,25);g.fillEllipse(x+37,y+1,49,19)}
  }
  private makeTextures(){
    if(this.textures.exists('bee'))return
    const g=this.add.graphics({x:0,y:0})
    g.lineStyle(3,0x49392b,1);g.fillStyle(0xffffff,.9);g.fillEllipse(30,15,20,27);g.fillEllipse(52,13,20,27);g.strokeEllipse(30,15,20,27);g.strokeEllipse(52,13,20,27)
    g.fillStyle(0xf4c73f,1);g.fillEllipse(42,42,51,38);g.lineStyle(3,0x49392b,1);g.strokeEllipse(42,42,51,38);g.fillStyle(0xf9df78,.65);g.fillEllipse(29,34,13,8);g.fillEllipse(63,48,8,5);g.fillStyle(0x342c28,1);g.fillRect(39,23,8,37);g.fillRect(53,25,7,34)
    g.fillStyle(0xffffff,1);g.fillCircle(34,38,5);g.fillCircle(48,38,5);g.fillStyle(0x302a27,1);g.fillCircle(35,39,2.5);g.fillCircle(49,39,2.5);g.lineStyle(2,0x49392b,1);g.beginPath();g.moveTo(32,25);g.lineTo(26,14);g.moveTo(51,25);g.lineTo(56,14);g.strokePath();g.generateTexture('bee',84,70);g.clear()
    g.lineStyle(5,0x4b382a,1);g.lineBetween(3,18,75,3);g.lineStyle(9,0x83583e,1);g.lineBetween(3,18,75,3);g.fillStyle(0x49392b,1);g.fillTriangle(29,8,35,0,36,15);g.fillTriangle(59,4,66,0,65,12);g.generateTexture('thorn',80,26);g.clear()
    const makeBarrier=(name:string,fill:number,highlight:number)=>{
      const outline=[{x:8,y:4},{x:69,y:2},{x:77,y:8},{x:74,y:34},{x:68,y:40},{x:11,y:38},{x:3,y:31},{x:4,y:11}]
      g.lineStyle(3,0x4a5141,1);g.fillStyle(fill,1);g.fillPoints(outline,true);g.strokePoints(outline,true)
      g.lineStyle(2,highlight,.85);g.lineBetween(13,9,66,7);g.lineBetween(10,32,66,34)
      g.lineStyle(1,0x354335,.4);g.lineBetween(17,16,37,14);g.lineBetween(46,24,67,21);g.lineBetween(23,27,40,25)
      g.generateTexture(name,80,42);g.clear()
    }
    makeBarrier('barrier-green',0x76a875,0xb6d29a);makeBarrier('barrier-wood',0x987653,0xd0ae79)
    g.lineStyle(2,0x51404a,1);g.lineBetween(20,0,20,15);g.lineStyle(3,0x51404a,1);g.fillStyle(0x51404a,1);g.fillCircle(20,21,10);g.fillStyle(0xf8f0d7,1);g.fillCircle(16,19,2);g.fillCircle(23,19,2);g.generateTexture('spider',40,36);g.clear()
    g.lineStyle(3,0x4d493b,1);g.fillStyle(0x88816d,1);g.fillPoints([{x:18,y:4},{x:35,y:10},{x:39,y:24},{x:29,y:37},{x:10,y:35},{x:3,y:23},{x:7,y:11}],true);g.strokePoints([{x:18,y:4},{x:35,y:10},{x:39,y:24},{x:29,y:37},{x:10,y:35},{x:3,y:23},{x:7,y:11}],true);g.lineStyle(1,0xc5b99b,1);g.lineBetween(13,15,26,12);g.lineBetween(15,25,29,22);g.generateTexture('rock',44,42);g.clear()
    g.fillStyle(0xffffff,.82);g.fillEllipse(28,23,42,20);g.fillEllipse(53,18,45,25);g.fillEllipse(78,24,42,20);g.generateTexture('cloud',110,46)
  }
  private spawnPattern(x:number){
    spawnObstaclePattern(this,this.obstacles,this.scenery,x,this.travelled,this.patternIndex,this.scale.height)
    this.patternIndex++
  }
  update(_time:number,delta:number){if(this.ended)return;const dt=Math.min(delta/1000,.04),height=this.scale.height
    if(this.held)this.bee.body!.velocity.y-=endlessFlightConfig.liftAcceleration*dt
    this.bee.body!.velocity.y=Phaser.Math.Clamp(this.bee.body!.velocity.y,-endlessFlightConfig.maximumRiseVelocity,endlessFlightConfig.maximumFallVelocity)
    this.bee.angle=Phaser.Math.Clamp(this.bee.body!.velocity.y*.055,-22,30)
    if(this.bee.y<0||this.bee.y>height){this.finish();return}
    const speed=Math.min(endlessFlightConfig.maximumSpeed,endlessFlightConfig.initialSpeed+this.travelled/endlessFlightConfig.speedRampDistance);this.travelled+=speed*dt
    this.parallax.children.iterate(obj=>{const cloud=obj as Phaser.GameObjects.Image;if(!cloud)return true;cloud.x-=speed*dt*.13;if(cloud.x<-100)cloud.x=this.scale.width+100;return true})
    this.obstacles.children.iterate(obj=>{const item=obj as Phaser.Physics.Arcade.Image;if(!item)return true;item.x-=speed*dt;if(item.x < -160)item.destroy();return true})
    this.scenery.children.iterate(obj=>{const item=obj as Phaser.GameObjects.Image;if(!item)return true;item.x-=speed*dt;if(item.x < -160)item.destroy();return true})
    const spacing=Math.max(this.scale.width*.85,endlessFlightConfig.initialPatternSpacing-this.travelled/endlessFlightConfig.patternSpacingRamp)
    while(this.travelled>=this.nextPattern){this.spawnPattern(this.scale.width+70);this.nextPattern+=spacing}
    this.obstacles.children.iterate(obj=>{const item=obj as Phaser.Physics.Arcade.Image;if(item?.getData('scoreGate')&&item.x<this.bee.x){item.setData('scoreGate',false);this.score++;this.game.events.emit('flight-hud',{distance:Math.floor(this.travelled/10),score:this.score,speed:Math.floor(speed)})}return true})
    this.hudClock+=delta;if(this.hudClock>100){this.hudClock=0;this.game.events.emit('flight-hud',{distance:Math.floor(this.travelled/10),score:this.score,speed:Math.floor(speed)})}
  }
  private finish(){if(this.ended)return;this.ended=true;this.held=false;this.physics.pause();this.game.events.emit('flight-gameover',{distance:Math.floor(this.travelled/10),score:this.score,speed:Math.floor(Math.min(endlessFlightConfig.maximumSpeed,endlessFlightConfig.initialSpeed+this.travelled/endlessFlightConfig.speedRampDistance))})}
  setFlightPaused(paused:boolean){if(paused){this.held=false;this.scene.pause()}else this.scene.resume()}
}
