import * as T from 'three';
import {readCamera,saveCamera} from './settings';
import {ARENA as A,CAMERA as C,PLAYER} from '../../shared/config';
import type {PlayerState} from '../../shared/protocol';
export class FollowCamera {
  settings=readCamera();orbit=0;elevation=0;manual=false;
  constructor(){document.documentElement.style.setProperty('--ui-scale',String(this.settings.uiScale));addEventListener('camera-settings',()=>{this.settings=readCamera();});addEventListener('camera-orbit',e=>{const d=(e as CustomEvent).detail;this.orbit-=d.x*.003*this.settings.sensitivity;this.elevation=T.MathUtils.clamp(this.elevation+d.y*.004*(this.settings.invertY?-1:1),-1,1.4);if(!this.manual){this.orbit=this.yaw-d.x*.003*this.settings.sensitivity;}this.manual=true;});addEventListener('camera-zoom',e=>{this.settings.distance=T.MathUtils.clamp(this.settings.distance+(e as CustomEvent).detail*.004,5,10);saveCamera(this.settings);});}
  yaw=0;ready=false;look=new T.Vector3();
  update(camera:T.PerspectiveCamera,player:PlayerState,position:T.Vector3,rock:T.Vector3,rockCam:boolean,dt:number,reset=false){
    const speed=Math.hypot(player.velocity.x,player.velocity.z),ratio=T.MathUtils.clamp(speed/PLAYER.boostMaxSpeed,0,1);
    if(reset){this.manual=false;this.orbit=0;this.elevation=0;}const c=this.settings;const distance=c.distance;
    const direction=rock.clone().sub(position);direction.y=0;
    const targetYaw=this.manual&&!rockCam?this.orbit:rockCam&&direction.lengthSq()>1?Math.atan2(-direction.x,-direction.z):!player.grounded&&(player.dodging>0||Math.abs(player.pitch)>1.1)?this.yaw:player.yaw;
    if(!this.ready||reset)this.yaw=targetYaw;
    else this.yaw+=Math.atan2(Math.sin(targetYaw-this.yaw),Math.cos(targetYaw-this.yaw))*(1-Math.exp(-c.swivel*dt));
    const desired=new T.Vector3(position.x+Math.sin(this.yaw)*distance,position.y+c.height+this.elevation*2,position.z+Math.cos(this.yaw)*distance);
    desired.x=T.MathUtils.clamp(desired.x,-A.width/2+1.5,A.width/2-1.5);
    desired.z=T.MathUtils.clamp(desired.z,-A.length/2+1.5,A.length/2-1.5);
    const cornerLimit=A.width/2+A.length/2-A.cornerCut-2,sum=Math.abs(desired.x)+Math.abs(desired.z);
    if(sum>cornerLimit){desired.x*=cornerLimit/sum;desired.z*=cornerLimit/sum;}
    desired.y=Math.max(1.5,desired.y);
    const look=position.clone().add(new T.Vector3(-Math.sin(this.yaw)*2,c.height+Math.tan(c.angle*Math.PI/180)*distance,-Math.cos(this.yaw)*2));
    if(rockCam)look.lerp(rock,Math.min(.4,8/Math.max(8,direction.length())));
    if(!this.ready||reset){camera.position.copy(desired);this.look.copy(look);this.ready=true;}
    else {camera.position.lerp(desired,1-Math.exp(-c.stiffness*dt));this.look.lerp(look,1-Math.exp(-c.swivel*dt));}
    camera.lookAt(this.look);camera.fov=T.MathUtils.lerp(camera.fov,c.fov,1-Math.exp(-dt*4));camera.updateProjectionMatrix();
  }
}
