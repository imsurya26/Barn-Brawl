import * as T from 'three';
import type {Snapshot} from '../../shared/protocol';
/** Only instantiated by a Vite development build with ?physics=1. */
export class PhysicsOverlay {
  enabled=true;fps=0;
  frame(dt:number){this.fps+=(1/Math.max(dt,.001)-this.fps)*.05;}
  group=new T.Group();colliders:T.LineSegments;rays:T.LineSegments;velocities:T.LineSegments;normals:T.LineSegments;contacts:T.Points;label=document.createElement('pre');
  constructor(scene:T.Scene){
    const lines=(color:number)=>{const l=new T.LineSegments(new T.BufferGeometry(),new T.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.7}));this.group.add(l);return l;};
    addEventListener('keydown',e=>{if(e.code==='F3'){e.preventDefault();this.enabled=!this.enabled;}});
    this.colliders=lines(0x80ddff);this.rays=lines(0xffcc33);this.velocities=lines(0xf077e7);this.normals=lines(0x78ff99);
    this.contacts=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:0xff4455,size:.3,depthTest:false}));this.group.add(this.contacts);scene.add(this.group);
    this.label.id='physics-debug';this.label.style.cssText='position:fixed;top:130px;left:16px;padding:12px;background:#10251cdb;color:#d4f5dd;font:11px monospace;pointer-events:none;z-index:3';document.body.append(this.label);
  }
  update(s:Snapshot|undefined,id:string){
    this.group.visible=this.enabled&&!!s?.debug;this.label.hidden=!s||!this.enabled;
    if(!s)return;const p=s.players.find(p=>p.id===id);
    this.label.textContent=p?`PHYSICS DEBUG · SERVER ${s.tick}\nSpeed ${Math.hypot(p.velocity.x,p.velocity.z).toFixed(2)} m/s\nFPS ${this.fps.toFixed(0)} · Tick ${(s.debug?.tickMs??0).toFixed(2)} ms\nAngular ${Math.hypot(p.angularVelocity.x,p.angularVelocity.y,p.angularVelocity.z).toFixed(2)} rad/s\nJump ${p.jumpState} · Probes ${p.probeCount}\nGrounded ${p.grounded} · Boost ${p.boost.toFixed(1)}\nPitch ${p.pitch.toFixed(2)} · Roll ${p.roll.toFixed(2)}\nDodge available ${p.dodgeAvailable}\nCyan: colliders · Yellow: ground probes\nPink: velocity · Red: contact points${s.debug?'':'\nStart server with PHYSICS_DEBUG=1 for geometry'}`:'';
    if(!s.debug)return;
    for(const [object,values] of [[this.colliders,s.debug.vertices],[this.rays,s.debug.rays],[this.velocities,s.debug.velocities],[this.normals,s.debug.normals??[]],[this.contacts,s.debug.contacts.flatMap(p=>[p.x,p.y,p.z])]] as const){object.geometry.dispose();object.geometry=new T.BufferGeometry();object.geometry.setAttribute('position',new T.Float32BufferAttribute(values,3));}
  }
}
