import {Stadium} from './stadium';
import * as T from 'three';
import {sculptedRock} from './rock';
import {mapTheme,type MapId} from '../../shared/maps';
import { createArena } from './arena';
import { animateAnimal,createAnimal,mesh,type AnimalModel } from './animals';
import { BoostEffects } from '../effects/boost';
import { boostStyle,ROCK,PLAYER,CAMERA } from '../../shared/config';
import {attitude} from '../../shared/controller';
import { idleInput,type Snapshot,type PlayerState,type Input } from '../../shared/protocol';
import {LocalPrediction} from '../network/prediction';
import {FollowCamera} from '../camera/follow';
import {PhysicsOverlay} from './debug';
import type { Sound } from '../audio/sound';
type Visual={ animal:AnimalModel; label:T.Sprite; appearance:string; lastBoost:boolean; lastGround:boolean;lastSpeed:number;impact:number };
export class GameView {
  renderer:T.WebGLRenderer; scene=new T.Scene(); camera=new T.PerspectiveCamera(CAMERA.fov,innerWidth/innerHeight,.1,300); clock=new T.Clock();
  visuals=new Map<string,Visual>(); rock:T.Mesh; effects:BoostEffects; blades:T.Group; state?:Snapshot; self='';
  buffer:{time:number;state:Snapshot}[]=[]; hero:AnimalModel[]=[]; cameraReady=false; shake=0; lastRockSpeed=0; menu=true;
  prediction=new LocalPrediction();follow=new FollowCamera();rockCam=false;
  stadium!:Stadium;victoryStart=0;skipVictory=false;debug?:PhysicsOverlay;
  arenaRoot!:T.Group;atmosphere?:ReturnType<typeof createArena>['atmosphere'];mapId:MapId='barnyard';loadingMap=false;mapRequest=0;
  frameMs=0;sun!:T.DirectionalLight;fill!:T.HemisphereLight;quality='medium';particles=1;impactShake=0;lastEvent=-1;
  setQuality(value:string){this.quality=['low','medium','high'].includes(value)?value:'medium';this.particles=this.quality==='low'?.4:this.quality==='high'?1.5:1;this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.quality==='low'?.85:this.quality==='high'?1.75:1.25));this.renderer.shadowMap.enabled=this.quality!=='low';this.sun.shadow.mapSize.setScalar(this.quality==='high'?2048:1024);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.renderer.setSize(innerWidth,innerHeight);}
  async loadMap(id:MapId,force=false){if((id===this.mapId&&!force)||this.loadingMap&&id===this.mapId&&!force)return;this.mapId=id;this.loadingMap=true;const request=++this.mapRequest;
    const label=document.createElement('div');label.className='map-loading';label.textContent=`LOADING MAP... 15% · ${mapTheme(id).name}`;document.body.append(label);
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));label.textContent='LOADING MAP... 40% · Building stadium';
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));if(request!==this.mapRequest){label.remove();return;}
    const next=createArena(this.scene,id,this.particles);label.textContent='LOADING MAP... 85% · Preparing lighting';
    this.scene.remove(this.arenaRoot);this.arenaRoot.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
    this.arenaRoot=next.arena;this.blades=next.blades;this.atmosphere=next.atmosphere;
    document.body.dataset.map=id;const theme=mapTheme(id);this.scene.background=new T.Color(theme.sky);this.scene.fog=new T.Fog(theme.fog,100,250);this.sun.color.setHex(theme.sun);this.sun.intensity=theme.intensity;this.fill.color.setHex(theme.fill);this.fill.groundColor.setHex(theme.ground);this.renderer.toneMappingExposure=theme.exposure;
    this.follow.ready=false;label.textContent='LOADING MAP... 100%';await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));label.remove();this.loadingMap=false;
  }
  constructor(canvas:HTMLCanvasElement,private sound:Sound) {
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'}); this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)); this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap; this.renderer.outputColorSpace=T.SRGBColorSpace; this.renderer.toneMapping=T.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.15;
    this.scene.background=new T.Color(0xe7e6c8); this.scene.fog=new T.Fog(0xe7e6c8,115,270);
    this.fill=new T.HemisphereLight(0xc9e8ff,0x6a8057,2);this.scene.add(this.fill);
    const sun=new T.DirectionalLight(0xffebc8,3.2);sun.position.set(-35,70,32);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-85;sun.shadow.camera.right=85;sun.shadow.camera.top=85;sun.shadow.camera.bottom=-85;sun.shadow.camera.far=210;sun.shadow.normalBias=.05;this.scene.add(sun);
    this.sun=sun;const arena=createArena(this.scene);this.blades=arena.blades;this.arenaRoot=arena.arena;this.atmosphere=arena.atmosphere;
    this.setQuality(localStorage.getItem('graphicsQuality')??'medium');addEventListener('graphics-quality',e=>{this.setQuality((e as CustomEvent).detail);void this.loadMap(this.mapId,true);});void this.loadMap('barnyard',true);
    this.rock=sculptedRock();this.rock.position.set(0,ROCK.radius,0);this.scene.add(this.rock);
    this.effects=new BoostEffects(this.scene);this.stadium=new Stadium(this.scene);addEventListener('skip-victory',()=>this.skipVictory=true);
    if(import.meta.env.DEV&&new URLSearchParams(location.search).get('physics')==='1')this.debug=new PhysicsOverlay(this.scene);
    for(const [i,kind] of (['goat','pig','cow','chicken'] as const).entries()) { const a=createAnimal(kind,i%2);a.root.position.set([-5,4,7,-3][i],1.2,[5,1,9,-7][i]);a.root.rotation.y=[-.5,1.8,2.6,-.2][i];this.scene.add(a.root);this.hero.push(a); }
    addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);});
  }
  nameLabel(player:PlayerState) {const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d')!;ctx.fillStyle=player.team===0?'#ba512b':'#286d70';ctx.beginPath();ctx.roundRect(12,8,488,72,28);ctx.fill();ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff7df';ctx.fillText(player.nickname,256,56);const texture=new T.CanvasTexture(c);const label=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));label.scale.set(3.8,.72,1);return label;}
  receive(state:Snapshot,id:string) {void this.loadMap(state.mapId);const reset=state.phase==='COUNTDOWN'&&this.state?.phase!=='COUNTDOWN';if(reset){this.follow.ready=false;this.buffer=[];}if(state.phase==='MATCH_END'&&this.state?.phase!=='MATCH_END'){this.victoryStart=performance.now();this.skipVictory=false;}if(state.code!==this.state?.code)this.stadium.lastEvent=0;this.self=id;this.state=state;const me=state.players.find(p=>p.id===id);if(me)this.prediction.receive(me,state,reset);this.buffer.push({time:performance.now(),state});if(this.buffer.length>12)this.buffer.shift();this.debug?.update(state,id);}
  clear() {void this.loadMap('barnyard');this.state=undefined;this.buffer=[];this.cameraReady=false;this.follow.ready=false;this.prediction.clear();this.debug?.update(undefined,'');}
  frame(resetCamera=false,input:Input=idleInput(),toggleRock=false) {
    const rawDt=this.clock.getDelta(),dt=Math.min(rawDt,.05),time=this.clock.elapsedTime;this.frameMs+=(rawDt*1000-this.frameMs)*.05;
    this.blades.rotation.z+=dt*.22;this.effects.update(dt);if(!this.follow.settings.reducedMotion)this.atmosphere?.update(dt);
    const s=this.state;this.stadium.update(s,time,dt,this.mapId,this.follow.settings.reducedMotion);this.menu=!s||s.phase==='LOBBY'; this.hero.forEach(a=>{a.root.visible=!s;animateAnimal(a,time,0,false,true,false);});
    if(toggleRock){this.rockCam=!this.rockCam;this.follow.manual=false;}
    const playing=!!s&&['PLAYING','OVERTIME'].includes(s.phase);
    const predicted=playing?this.prediction.advance(dt,input):undefined;
    if(s) {
      const targetTime=performance.now()-65; let before=this.buffer[0],after=this.buffer[this.buffer.length-1];
      for(let i=1;i<this.buffer.length;i++) if(this.buffer[i].time>=targetTime) {before=this.buffer[i-1];after=this.buffer[i];break;}
      const alpha=before && after && before!==after ? T.MathUtils.clamp((targetTime-before.time)/(after.time-before.time),0,1):1;
      for(const p of s.players) {
        const key=`${p.animal}:${p.team}`;let v=this.visuals.get(p.id);
        if(v?.appearance!==key) {if(v)this.disposeVisual(v);const animal=createAnimal(p.animal,p.team),label=this.nameLabel(p);this.scene.add(animal.root,label);v={animal,label,appearance:key,lastBoost:false,lastGround:true,lastSpeed:0,impact:0};this.visuals.set(p.id,v);}
        const pa=before?.state.players.find(a=>a.id===p.id)??p,pb=after?.state.players.find(a=>a.id===p.id)??p;
        const local=p.id===this.self&&predicted&&this.prediction.safe?predicted:undefined;
        const pos=local?new T.Vector3().copy(local.position):new T.Vector3().copy(pa.position).lerp(new T.Vector3().copy(pb.position),alpha);
        if(new T.Vector3().copy(pa.position).distanceTo(new T.Vector3().copy(pb.position))>10)pos.copy(p.position);
        const yaw=local?.yaw??(pa.yaw+Math.atan2(Math.sin(pb.yaw-pa.yaw),Math.cos(pb.yaw-pa.yaw))*alpha);
        const pitch=local?.pitch??T.MathUtils.lerp(pa.pitch,pb.pitch,alpha),roll=local?.roll??T.MathUtils.lerp(pa.roll,pb.roll,alpha);
        v!.animal.root.position.copy(pos).add(new T.Vector3(0,v!.animal.root.userData.groundOffset,0));const rotation=local?.rotation;v!.animal.root.quaternion.copy(rotation?new T.Quaternion(rotation.x,rotation.y,rotation.z,rotation.w):new T.Quaternion(pa.rotation.x,pa.rotation.y,pa.rotation.z,pa.rotation.w).slerp(new T.Quaternion(pb.rotation.x,pb.rotation.y,pb.rotation.z,pb.rotation.w),alpha));
        v!.label.position.copy(pos).add(new T.Vector3(0,2.1,0));v!.label.material.opacity=p.connected?1:.4;
        const presented=local??p;
        const speed=Math.hypot(p.velocity.x,p.velocity.z);if((v!.lastSpeed-speed>5||!v!.lastGround)&&p.grounded)v!.impact=1;v!.impact=Math.max(0,v!.impact-dt*3);v!.lastSpeed=speed;animateAnimal(v!.animal,time,speed,p.boosting,p.grounded,false,(s.phase==='GOAL_PAUSE'&&s.goalTeam===p.team)||(s.phase==='MATCH_END'&&p.team===(s.score[0]>s.score[1]?0:1)),v!.impact,p.yawRate);v!.animal.lod.update(this.camera);
        const a=v!.animal,g=p.game;if(g?.abilityTime){if(p.animal==='goat')a.head.rotation.x=-.45;if(p.animal==='pig')a.body.scale.y=.8;if(p.animal==='cow')a.body.position.y-=.18;if(p.animal==='chicken')a.ears.forEach((b,i)=>b.rotation.z=(i?1:-1)*(1+Math.sin(time*35)*.3));}if(g?.activePower==='shield')a.body.scale.x=1.08;
        if(s.phase==='MATCH_END'){const winner=s.score[0]>s.score[1]?0:1,ordered=[...s.players].sort((a,b)=>Number(b.team===winner)-Number(a.team===winner)||Number(b.id===s.mvpId)-Number(a.id===s.mvpId)),index=ordered.findIndex(x=>x.id===p.id);a.root.position.set(-5.4+index*3.6,2.4-index*.15+a.root.userData.groundOffset,18);a.root.rotation.set(0,Math.PI,0);v!.label.position.copy(a.root.position).add(new T.Vector3(0,2.2,0));if(p.team===winner){if(p.animal==='goat')a.head.rotation.x=Math.sin(time*8)*.3;if(p.animal==='pig')a.body.rotation.z=Math.sin(time*5)*.3;if(p.animal==='cow')a.head.rotation.z=Math.sin(time*3)*.2;if(p.animal==='chicken')a.ears.forEach((b,i)=>b.rotation.z=(i?1:-1)*(1+Math.sin(time*15)*.4));}}


        if(p.boosting) {this.effects.emit(pos,yaw,p.boostStyleId,boostStyle(p.boostStyleId).boostLoopEffect*this.particles);if(!v!.lastBoost)this.effects.emit(pos,yaw,p.boostStyleId,boostStyle(p.boostStyleId).boostStartEffect);if(p.id===this.self)this.sound.boost(boostStyle(p.boostStyleId).audioPreset);}
        else if(v!.lastBoost){this.effects.emit(pos,yaw,p.boostStyleId,boostStyle(p.boostStyleId).boostEndEffect);if(p.boost<1){v!.impact=.5;this.effects.emit(pos,yaw,'dust',2);if(p.id===this.self)this.sound.tone(55,.15,'triangle',.1);}}
        if(p.id===this.self && p.grounded!==v!.lastGround)this.sound.tone(p.grounded?100:420,.13,'triangle',.15);
        v!.lastBoost=p.boosting;v!.lastGround=p.grounded;
      }
      for(const [id,v] of this.visuals)if(!s.players.some(p=>p.id===id)){this.disposeVisual(v);this.visuals.delete(id);}
      const ra=before?.state.rock??s.rock,rb=after?.state.rock??s.rock;this.rock.position.copy(ra.position).lerp(new T.Vector3().copy(rb.position),alpha);this.rock.quaternion.copy(new T.Quaternion(ra.rotation.x,ra.rotation.y,ra.rotation.z,ra.rotation.w)).slerp(new T.Quaternion(rb.rotation.x,rb.rotation.y,rb.rotation.z,rb.rotation.w),alpha);
      if(s.eventId!==this.lastEvent){this.lastEvent=s.eventId;if(s.phase==='GOAL_PAUSE'){const id=this.mapId==='harvest'?'hay':this.mapId==='frostbite'?'wind':this.mapId==='canyon'?'dust':'spark';this.effects.emit(this.rock.position,0,id,50*this.particles);}}
      const rockSpeed=Math.hypot(s.rock.velocity.x,s.rock.velocity.z);if(rockSpeed>35&&Math.random()<dt*20)this.effects.emit(this.rock.position,Math.atan2(-s.rock.velocity.x,-s.rock.velocity.z),'wind',1);if(Math.abs(rockSpeed-this.lastRockSpeed)>7){this.sound.tone(75,.2,'triangle',.22);this.shake=.13;this.impactShake=.07;this.effects.emit(this.rock.position,0,'dust',8*this.particles);}this.lastRockSpeed=rockSpeed;
      const me=s.players.find(p=>p.id===this.self);const visual=me && this.visuals.get(me.id);
      if(!this.menu&&me&&visual) {
        this.follow.update(this.camera,this.prediction.safe&&predicted?predicted:me,visual.animal.root.position,this.rock.position,this.rockCam,dt,resetCamera);
        if(this.impactShake>0&&this.follow.settings.shake>0&&!this.follow.settings.reducedMotion){{this.camera.position.x+=Math.sin(time*75)*this.impactShake*this.follow.settings.shake;this.camera.position.y+=Math.cos(time*65)*this.impactShake*.4*this.follow.settings.shake;}this.impactShake=Math.max(0,this.impactShake-dt*.4);}
        const mode=document.getElementById('camera-mode');if(mode)mode.textContent=this.rockCam?'ROCK CAM':'PLAYER CAM';
      }
    } else {for(const v of this.visuals.values())this.disposeVisual(v);this.visuals.clear();this.rock.position.set(0,ROCK.radius,0);this.rock.rotation.y+=dt*.15;}
    if(this.menu) {this.follow.ready=false;this.camera.fov=49;this.camera.updateProjectionMatrix();this.camera.position.set(65+(this.follow.settings.reducedMotion?0:Math.sin(time*.06)*2),66,78);this.camera.lookAt(-9,0,-5);}
    if(import.meta.env.DEV&&new URLSearchParams(location.search).get('models')==='1'){
      this.arenaRoot.visible=false;this.rock.visible=false;this.scene.background=new T.Color(0x243f48);this.scene.fog=null;
      this.hero.forEach((a,i)=>{a.root.visible=true;a.root.position.set(-3.3+i*2.2,1,0);a.root.rotation.y=-.15;});
      this.camera.fov=42;this.camera.position.set(1.8,2.8,-10);this.camera.lookAt(0,1,0);this.camera.updateProjectionMatrix();document.getElementById('ui')!.hidden=true;
    }
    if(s?.phase==='GOAL_PAUSE'&&!this.follow.settings.reducedMotion){const focus=this.rock.position.clone();const scorer=s.scorerId&&this.visuals.get(s.scorerId);if(scorer)focus.lerp(scorer.animal.root.position,.3);const dest=focus.clone().add(new T.Vector3(9,6,s.goalTeam===0?12:-12));this.camera.position.lerp(dest,1-Math.exp(-dt*this.follow.settings.transition));this.camera.lookAt(focus);}
    if(s?.phase==='MATCH_END'){const angle=this.skipVictory||this.follow.settings.reducedMotion?0:Math.min(8,(performance.now()-this.victoryStart)/1000)*.05;this.camera.position.set(-8+Math.sin(angle)*8,6,31);this.camera.lookAt(-2,2.5,18);this.camera.fov=60;this.camera.updateProjectionMatrix();}
    this.debug?.frame(rawDt);this.renderer.render(this.scene,this.camera);
  }
  disposeVisual(v:Visual) {this.scene.remove(v.animal.root,v.label);v.animal.root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});v.animal.skeleton.dispose();v.label.material.map?.dispose();v.label.material.dispose();}
}
