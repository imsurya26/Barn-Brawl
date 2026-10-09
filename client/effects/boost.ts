import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BOOSTS, boostStyle } from '../../shared/config';
type Particle={mesh:T.Mesh; life:number; max:number; velocity:T.Vector3; style:string};
export class BoostEffects {
  pool:Particle[]=[]; cursor=0;
  geometries = { puff:new T.IcosahedronGeometry(.22,0), straw:new T.BoxGeometry(.065,.07,.55), spark:new T.OctahedronGeometry(.17,0), wind:new T.BoxGeometry(.04,.04,1.1), poop:mergeGeometries([new T.ConeGeometry(.23,.22,7),new T.ConeGeometry(.16,.21,7).translate(0,.13,0),new T.ConeGeometry(.09,.18,7).translate(.025,.25,0)])! };
  materials=new Map(BOOSTS.map(b=>[b.id,new T.MeshStandardMaterial({color:b.color,roughness:1,emissive:b.id==='spark'?b.color:0,emissiveIntensity:.6})]));
  constructor(scene:T.Scene) { for(let i=0;i<220;i++) { const mesh=new T.Mesh(this.geometries.puff,this.materials.get('dust')); mesh.visible=false; scene.add(mesh); this.pool.push({mesh,life:0,max:1,velocity:new T.Vector3(),style:'dust'}); } }
  emit(position:T.Vector3,yaw:number,id:string,count=2) {
    const style=boostStyle(id);
    for(let i=0;i<count;i++) { const p=this.pool[this.cursor++%this.pool.length]; p.mesh.geometry=this.geometries[style.particlePreset]; p.mesh.material=this.materials.get(style.id)!; p.style=id; p.life=p.max=.35+style.trailPreset+Math.random()*.3; p.mesh.visible=true;
      p.mesh.position.copy(position).add(new T.Vector3(Math.sin(yaw)*1.2+(Math.random()-.5)*.7,-.6,Math.cos(yaw)*1.2+(Math.random()-.5)*.7)); p.velocity.set(Math.sin(yaw)*3+(Math.random()-.5)*3,Math.random()*2,Math.cos(yaw)*3+(Math.random()-.5)*3); p.mesh.rotation.set(Math.random(),yaw,Math.random()); p.mesh.scale.setScalar(1);
    }
  }
  update(dt:number) { for(const p of this.pool) if(p.life>0) { p.life-=dt; p.mesh.visible=p.life>0; p.mesh.position.addScaledVector(p.velocity,dt); p.velocity.y-=dt*1.2; const t=p.life/p.max; p.mesh.scale.setScalar(Math.max(.01,t*(p.style==='dust'?2:1))); if(p.style==='hay'||p.style==='poop') p.mesh.rotation.x+=dt*4; } }
}
