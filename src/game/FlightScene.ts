import Phaser from 'phaser'

const START_SPEED=165
const START_GAP=300

export class FlightScene extends Phaser.Scene {
  private bee!:Phaser.Physics.Arcade.Sprite
  private held=false
  private travelled=0
  private score=0
  private nextPattern=550
  private obstacles!:Phaser.Physics.Arcade.Group
  private scenery!:Phaser.GameObjects.Group
  private parallax!:Phaser.GameObjects.Group
  private backdrop!:Phaser.GameObjects.Graphics
  private hudClock=0
  private ended=false
  private patternIndex=0
  private biome=0
  private autostart=false
  constructor(){super('flight')}
  init(data:{autostart?:boolean}={}){this.autostart=data.autostart??false;this.travelled=0;this.score=0;this.nextPattern=900;this.patternIndex=0;this.biome=0;this.ended=false;this.held=false}
  create(){
    this.makeTextures();this.backdrop=this.paintBackdrop(0)
    this.scenery=this.add.group();this.parallax=this.add.group();this.obstacles=this.physics.add.group({allowGravity:false,immovable:true})
    const width=this.scale.width,height=this.scale.height
    for(let i=0;i<5;i++){const cloud=this.add.image(width*(.08+i*.21),height*(.14+(i%3)*.1),'cloud').setDepth(0).setScale(.65+(i%3)*.12).setAlpha(.68);this.parallax.add(cloud)}
    this.bee=this.physics.add.sprite(width*.23,height*.5,'bee').setDepth(5).setScale(Math.max(.72,Math.min(1.05,width/700)));this.bee.setCircle(17,8,7);this.bee.setGravityY(390);this.bee.setMaxVelocity(0,230);this.bee.setCollideWorldBounds(false);this.tweens.add({targets:this.bee,scaleY:1.13,duration:100,yoyo:true,repeat:-1,ease:'Sine.inOut'})
    this.input.on('pointerdown',()=>this.held=true);this.input.on('pointerup',()=>this.held=false);this.input.keyboard?.on('keydown-SPACE',()=>this.held=true);this.input.keyboard?.on('keyup-SPACE',()=>this.held=false);this.input.keyboard?.on('keydown-UP',()=>this.held=true);this.input.keyboard?.on('keyup-UP',()=>this.held=false)
    this.physics.add.overlap(this.bee,this.obstacles,()=>this.finish())
    this.game.events.emit('flight-hud',{distance:0,score:0,speed:START_SPEED})
    // Keep the scene still under the start screen, even if the UI listener attaches late.
    if(!this.autostart)this.scene.pause()
    this.game.events.emit('flight-ready')
  }
  private paintBackdrop(biome:number){
    // Cover the viewport without stretching the illustrated landscape on portrait phones.
    const coverScale=Math.max(this.scale.width/960,this.scale.height/540)
    const g=this.add.graphics().setDepth(-5).setScale(coverScale).setPosition((this.scale.width-960*coverScale)/2,(this.scale.height-540*coverScale)/2)
    const palettes=[
      [0xdcebd3,0xe2efd9,0xb7d6b3,0xc5dfbd], // sunny garden
      [0xd7eaf0,0xe6f1ed,0xa9d2b1,0xc1dfc3], // flower meadow
      [0xc7dfc7,0xd6e7d1,0x88b38d,0xa0c69d], // spider forest
      [0x343f58,0x49516d,0x41465e,0x55536e], // mushroom night
      [0xd1e9e3,0xe2f0e8,0x86c4bd,0xa6d2c3], // pond
      [0xf1dfc5,0xf7e9d1,0xd1bd8f,0xe0cb9c], // sunset
      [0x424b6a,0x555a79,0x454c66,0x59617a], // firefly night
      [0xe3edcf,0xe9f1d7,0xb3d4a4,0xcbe1af], // hive garden
    ][biome]
    g.fillGradientStyle(palettes[0],palettes[1],palettes[2],palettes[3],1);g.fillRect(0,0,960,540)
    const night=biome===3||biome===6
    if(!night){
      // Soft overlapping hill shapes and a simple grass line match the level-card illustration.
      g.fillStyle(palettes[2],.58);g.fillEllipse(130,286,540,184);g.fillEllipse(620,274,650,190)
      g.fillStyle(palettes[3],.72);g.fillEllipse(170,355,620,130);g.fillEllipse(760,345,680,142)
      g.fillStyle(palettes[2],.82);g.fillRect(0,369,960,171)
      g.lineStyle(2,0x829e75,.55);g.lineBetween(0,367,960,367)
      g.fillStyle(biome===5?0xffe5a0:0xffffff,.12);g.fillEllipse(470,245,810,470)
    }
    // Fine flecks and short pencil marks keep the field from feeling like a flat fill.
    let seed=7241+biome*7919;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
    for(let i=0;i<850;i++){const x=random()*960,y=random()*540;g.fillStyle(night?(i%3===0?0x90c9ff:0x081536):(i%3===0?0xffffff:0x728b5c),.035+random()*.065);g.fillCircle(x,y,.5+random()*.9)}
    for(let i=0;i<120;i++){const x=random()*960,y=365+random()*175;g.lineStyle(1,night?0xa3b8ec:(random()>.5?0x718d67:0xf4f4d8),.16);g.lineBetween(x,y,x+3+random()*9,y-1-random()*4)}
    // Minimal flower details are reserved for the pond biome.
    const flower=(x:number,y:number,s:number,color:number)=>{
      g.lineStyle(3,0x173c20,1);g.lineBetween(x,y+8*s,x-2*s,y+34*s)
      g.lineStyle(2,0x173c20,1);g.fillStyle(color,1)
      for(let p=0;p<5;p++){const a=p*Math.PI*2/5;const px=x+Math.cos(a)*9*s,py=y+Math.sin(a)*9*s;g.fillCircle(px,py,6*s);g.strokeCircle(px,py,6*s)}
      g.fillStyle(0xf6d934,1);g.fillCircle(x,y,4*s);g.lineStyle(1.5,0x173c20,1);g.strokeCircle(x,y,4*s)
    }
    if(biome===0||biome===1||biome===7){
      g.fillStyle(0xffffff,.42);for(const [x,y] of [[130,88],[430,118],[790,90]]){g.fillEllipse(x,y,68,22);g.fillEllipse(x+19,y-9,42,25);g.fillEllipse(x+37,y+1,49,19)}
    }
    if(biome===2||biome===7){
      for(const x of [26,905]){g.fillStyle(0x5a3926,1);g.fillRoundedRect(x,0,30,540,9);g.lineStyle(3,0x202f21,1);g.strokeRoundedRect(x,0,30,540,9);g.fillStyle(0x32713b,1);g.fillEllipse(x+12,65,118,96);g.lineStyle(3,0x1b482a,1);g.strokeEllipse(x+12,65,118,96)}
    }
    if(biome===2){g.lineStyle(2,0xd8e5ce,.78);for(let r=1;r<=4;r++)g.strokeCircle(842,78,r*19);for(let i=0;i<8;i++){const a=i*Math.PI/4;g.lineBetween(842,78,842+Math.cos(a)*76,78+Math.sin(a)*76)}}
    if(biome===3||biome===6){
      g.fillStyle(0xfff0a4,.92);g.fillCircle(790,88,35);g.fillStyle(palettes[0],1);g.fillCircle(806,76,31)
      for(let i=0;i<74;i++){const x=random()*960,y=random()*290;g.fillStyle(i%3===0?0xffe989:0xe7f2ff,.72);g.fillCircle(x,y,.8+random()*1.5)}
      if(biome===3){for(const x of [94,850]){g.fillStyle(0xf5e9ce,1);g.fillRect(x-7,430,14,58);g.fillStyle(0xe94b42,1);g.fillEllipse(x,425,66,35);g.lineStyle(3,0x17351f,1);g.strokeEllipse(x,425,66,35);for(let p=0;p<5;p++){g.fillStyle(0xffefcf,1);g.fillCircle(x-18+p*9,419+(p%2)*-7,3)}}}
      if(biome===6){for(const [x,y] of [[180,190],[410,110],[740,235],[615,385],[325,335],[865,145]]){g.fillStyle(0xffef7a,.22);g.fillCircle(x,y,15);g.fillStyle(0xfff59b,1);g.fillCircle(x,y,3)}}
    }
    if(biome===4){
      g.fillStyle(0x238f94,.84);g.fillRect(0,390,960,150);g.lineStyle(2,0xa8ece0,.46);for(let i=0;i<12;i++){const x=(i*113+27)%950,y=408+(i*31)%120;g.strokeEllipse(x,y,48+(i%4)*18,5+(i%3)*3)}
      for(const [x,y] of [[185,435],[426,477],[760,425]]){g.fillStyle(0x43a936,1);g.fillEllipse(x,y,88,28);g.lineStyle(3,0x173c20,1);g.strokeEllipse(x,y,88,28);g.lineBetween(x,y,x+17,y-9);flower(x+17,y-18,.48,0xf18db0)}
    }
    if(biome===5){g.fillStyle(0xffd56c,.96);g.fillCircle(714,325,66);g.lineStyle(3,0x9e5931,.65);g.strokeCircle(714,325,66)}
    if(biome===7){
      g.lineStyle(9,0x63452d,1);g.lineBetween(744,25,876,176);g.lineStyle(3,0x302c20,1);g.lineBetween(810,95,810,152);g.fillStyle(0xe5a735,1);g.fillRoundedRect(784,145,54,66,18);g.lineStyle(3,0x49351f,1);g.strokeRoundedRect(784,145,54,66,18);g.fillStyle(0x5b3b20,1);g.fillCircle(811,177,7)
    }
    return g
  }
  private makeTextures(){
    if(this.textures.exists('bee'))return
    const g=this.add.graphics({x:0,y:0})
    g.lineStyle(3,0x49392b,1);g.fillStyle(0xffffff,.9);g.fillEllipse(30,15,20,27);g.fillEllipse(52,13,20,27);g.strokeEllipse(30,15,20,27);g.strokeEllipse(52,13,20,27)
    g.fillStyle(0xf4c73f,1);g.fillEllipse(42,42,51,38);g.lineStyle(3,0x49392b,1);g.strokeEllipse(42,42,51,38);g.fillStyle(0xf9df78,.65);g.fillEllipse(29,34,13,8);g.fillEllipse(63,48,8,5);g.fillStyle(0x342c28,1);g.fillRect(39,23,8,37);g.fillRect(53,25,7,34)
    g.fillStyle(0xffffff,1);g.fillCircle(34,38,5);g.fillCircle(48,38,5);g.fillStyle(0x302a27,1);g.fillCircle(35,39,2.5);g.fillCircle(49,39,2.5);g.lineStyle(2,0x49392b,1);g.beginPath();g.moveTo(32,25);g.lineTo(26,14);g.moveTo(51,25);g.lineTo(56,14);g.strokePath();g.generateTexture('bee',84,70);g.clear()
    const flower=(name:string,color:number)=>{g.lineStyle(2,0x4c5738,1);g.lineBetween(20,28,20,55);g.lineStyle(1,0x4c5738,1);g.fillStyle(color,1);for(let i=0;i<6;i++){g.fillEllipse(20+Math.cos(i*Math.PI/3)*10,18+Math.sin(i*Math.PI/3)*10,13,9);g.strokeEllipse(20+Math.cos(i*Math.PI/3)*10,18+Math.sin(i*Math.PI/3)*10,13,9)}g.fillStyle(0xf2c849,1);g.fillCircle(20,18,6);g.generateTexture(name,40,60);g.clear()}
    flower('flower-yellow',0xf5d95c);flower('flower-pink',0xed92a5);flower('flower-gold',0xffe78a)
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
    const h=this.add.graphics({x:0,y:0});h.lineStyle(4,0x59402d,1);h.fillStyle(0xc88845,1);h.fillRoundedRect(6,15,84,70,25);h.strokeRoundedRect(6,15,84,70,25);h.fillStyle(0xe6b85c,1);h.fillEllipse(48,16,82,30);h.fillStyle(0x724d33,1);h.fillRect(30,44,8,36);h.fillRect(55,44,8,36);h.generateTexture('hive',96,92);h.clear();h.fillStyle(0xffffff,.82);h.fillEllipse(28,23,42,20);h.fillEllipse(53,18,45,25);h.fillEllipse(78,24,42,20);h.generateTexture('cloud',110,46);h.destroy()
  }
  private spawnPattern(x:number){
    const pattern=this.patternIndex, difficulty=Math.min(4,Math.floor(this.travelled/2200))
    // Later gardens shift the safe lane more sharply and vary it from pattern to pattern.
    const swing=58+difficulty*11
    const height=this.scale.height,gap=Math.max(185,Math.min(START_GAP,height*.56)-difficulty*28), center=Phaser.Math.Clamp(height/2+Math.sin(x*.0063+pattern*.72)*swing+Math.sin(x*.002)*45,35+gap/2,height-35-gap/2)
    const topHeight=center-gap/2,bottomY=center+gap/2
    const topTexture=pattern%2===0?'barrier-green':'barrier-wood',bottomTexture=pattern%2===0?'barrier-wood':'barrier-green'
    const top=this.obstacles.create(x,topHeight/2,topTexture) as Phaser.Physics.Arcade.Image;top.setDisplaySize(66,topHeight+12).setOrigin(.5).refreshBody();top.setData('kind','branch')
    const bottomH=height-bottomY,bottom=this.obstacles.create(x,(bottomY+height)/2,bottomTexture) as Phaser.Physics.Arcade.Image;bottom.setDisplaySize(66,bottomH+12).setOrigin(.5).refreshBody();bottom.setData('kind','branch')
    if(this.travelled>2000){const th=this.add.image(x,topHeight-12,'thorn').setDepth(3).setDisplaySize(130,30);this.scenery.add(th);const bh=this.add.image(x,bottomY+12,'thorn').setDepth(3).setDisplaySize(130,30);this.scenery.add(bh)}
    top.setData('scoreGate',true)
    if(this.travelled>4400&&(difficulty>=3||pattern%2===0)){
      const spider=this.physics.add.image(x+80,center+(pattern%2===0?-1:1)*gap*.25,'spider').setDepth(4)
      spider.body!.allowGravity=false;spider.setCircle(11,9,7);this.obstacles.add(spider)
      this.tweens.add({targets:spider,y:spider.y+(difficulty>=3?Phaser.Math.Between(38,62):Phaser.Math.Between(28,48)),duration:difficulty>=3?720:900,yoyo:true,repeat:-1,ease:'Sine.inOut'})
    }
    // Stones are introduced with the spiders, then paired into alternating patterns.
    if(difficulty>=2&&pattern%2===1){
      const rock=this.physics.add.image(x+135,center+gap*.31,'rock').setDepth(4).setScale(.8);rock.body!.allowGravity=false;rock.setCircle(15,7,6);this.obstacles.add(rock);this.tweens.add({targets:rock,y:rock.y-24,duration:1100,yoyo:true,repeat:-1,ease:'Sine.inOut'})
    }
    if(difficulty>=3&&pattern%3===2){
      const rock=this.physics.add.image(x+190,center-gap*.3,'rock').setDepth(4).setScale(.7);rock.body!.allowGravity=false;rock.setCircle(13,7,6);this.obstacles.add(rock);this.tweens.add({targets:rock,y:rock.y+30,duration:850,yoyo:true,repeat:-1,ease:'Sine.inOut'})
    }
    this.patternIndex++
  }
  update(_time:number,delta:number){if(this.ended)return;const dt=Math.min(delta/1000,.04),height=this.scale.height
    if(this.held)this.bee.body!.velocity.y-=650*dt
    this.bee.body!.velocity.y=Phaser.Math.Clamp(this.bee.body!.velocity.y,-220,230)
    this.bee.angle=Phaser.Math.Clamp(this.bee.body!.velocity.y*.055,-22,30)
    if(this.bee.y<0||this.bee.y>height){this.finish();return}
    const speed=Math.min(330,START_SPEED+this.travelled/70);this.travelled+=speed*dt
    const nextBiome=Math.floor(this.travelled/3200)%8
    if(nextBiome!==this.biome){
      this.biome=nextBiome
      const previous=this.backdrop;this.backdrop=this.paintBackdrop(this.biome).setAlpha(0)
      this.tweens.add({targets:this.backdrop,alpha:1,duration:850,ease:'Sine.out'})
      this.tweens.add({targets:previous,alpha:0,duration:850,ease:'Sine.in',onComplete:()=>previous.destroy()})
    }
    this.parallax.children.iterate(obj=>{const cloud=obj as Phaser.GameObjects.Image;if(!cloud)return true;cloud.setAlpha(this.biome===3||this.biome===6?.08:.68);cloud.x-=speed*dt*.13;if(cloud.x<-100)cloud.x=this.scale.width+100;return true})
    this.obstacles.children.iterate(obj=>{const item=obj as Phaser.Physics.Arcade.Image;if(!item)return true;item.x-=speed*dt;if(item.x < -160)item.destroy();return true})
    this.scenery.children.iterate(obj=>{const item=obj as Phaser.GameObjects.Image;if(!item)return true;item.x-=speed*dt;if(item.x < -160)item.destroy();return true})
    const spacing=Math.max(this.scale.width*.85,840-this.travelled/35)
    while(this.travelled>=this.nextPattern){this.spawnPattern(this.scale.width+70);this.nextPattern+=spacing}
    this.obstacles.children.iterate(obj=>{const item=obj as Phaser.Physics.Arcade.Image;if(item?.getData('scoreGate')&&item.x<this.bee.x){item.setData('scoreGate',false);this.score++;this.game.events.emit('flight-hud',{distance:Math.floor(this.travelled/10),score:this.score,speed:Math.floor(speed)})}return true})
    this.hudClock+=delta;if(this.hudClock>100){this.hudClock=0;this.game.events.emit('flight-hud',{distance:Math.floor(this.travelled/10),score:this.score,speed:Math.floor(speed)})}
  }
  private finish(){if(this.ended)return;this.ended=true;this.held=false;this.physics.pause();this.game.events.emit('flight-gameover',{distance:Math.floor(this.travelled/10),score:this.score,speed:Math.floor(Math.min(330,START_SPEED+this.travelled/70))})}
  setFlightPaused(paused:boolean){if(paused){this.held=false;this.scene.pause()}else this.scene.resume()}
}
