import './style.css';
import { GameView } from './rendering/game';
import { Controls } from './input/controls';
import { Sound } from './audio/sound';
import { Connection } from './network/connection';
import { Interface } from './ui/interface';
const progress=document.querySelector('#progress')!;
try {
  progress.textContent='35%';
  const sound=new Sound(),net=new Connection(),controls=new Controls(),ui=new Interface(net,sound);
  progress.textContent='65%';
  const view=new GameView(document.querySelector<HTMLCanvasElement>('#game')!,sound);
  net.onState=s=>{sound.receive(s);view.receive(s,net.id);ui.update(s);controls.enabled=['PLAYING','OVERTIME'].includes(s.phase)&&net.status==='ONLINE'&&ui.page!=='settings';};
  net.onNotice=m=>ui.toast(m);net.onStatus=()=>{if(!net.id&&!net.state){ui.state=undefined;view.clear();}ui.render(true);if(net.status!=='ONLINE'){controls.enabled=false;controls.keys.clear();}};
  ui.onLeave=()=>{sound.phase='LOBBY';sound.queue=[];sound.line?.pause();view.clear();controls.enabled=false;controls.keys.clear();};
  ui.render();net.connect();controls.onEdge=()=>{if(net.id&&net.status==='ONLINE')net.send({type:'input',input:controls.read()});};
  setInterval(()=>{if(net.id&&net.status==='ONLINE')net.send({type:'input',input:controls.read()});},1000/30);
  progress.textContent='100%';document.querySelector('#loading')?.remove();
  const frame=()=>{if(view.follow.settings.rockMode==='hold')view.rockCam=controls.keys.has('KeyQ');view.frame(controls.reset,controls.peek(),view.follow.settings.rockMode==='toggle'&&controls.toggleRock);controls.reset=false;controls.toggleRock=false;requestAnimationFrame(frame);};requestAnimationFrame(frame);
  // Read-only diagnostics for browser QA; no authoritative state mutations exposed.
  Object.defineProperty(window,'barnDebug',{get:()=>({state:net.state,id:net.id,status:net.status,drawCalls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles,frameMs:view.frameMs,mapId:view.mapId,loadingMap:view.loadingMap,quality:view.quality,cameraMode:view.rockCam?'ROCK':'PLAYER',cameraPosition:view.camera.position.toArray(),cameraSettings:view.follow.settings,crowdEnergy:view.stadium.energy,audio:{unlocked:!!sound.context,levels:sound.levels,phase:sound.phase},predicted:view.prediction.state,rendered:[...view.visuals].map(([id,v])=>({id,position:v.animal.root.position.toArray()}))})});
}catch(e){document.querySelector('#loading')!.innerHTML='<strong>THE FARM COULD NOT OPEN</strong><p>Enable WebGL / hardware acceleration and reload in a desktop browser.</p>';console.error(e);}
