import * as T from 'three';
import {mapTheme,type MapId} from '../../shared/maps';
import {decorateMap,weather} from './map-props';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box,ball,mesh } from './animals';
import {ARENA as A} from '../../shared/config';
import {boundaries,rampSections} from '../../shared/arena';
export function createArena(scene:T.Scene,id:MapId='barnyard',detail=1) {
  const theme=mapTheme(id);
  const arena=new T.Group(); scene.add(arena);
  box(arena,0,-.75,0,240,1.4,230,theme.ground);
  box(arena,0,-.16,0,A.width,.3,A.length,theme.turf);
  for(let z=-50;z<=50;z+=10) box(arena,0,.005,z,A.width,.018,5,theme.stripe);
  const line=0xe5e3b5;
  box(arena,0,.035,0,A.width-7,.04,.15,line);
  const circle=mesh(new T.TorusGeometry(8,.075,4,64),line); circle.rotation.x=Math.PI/2; circle.position.y=.05; arena.add(circle);
  ball(arena,0,.06,0,.24,line,1).scale.y=.1;
  const wood=theme.wood;
  for(const b of boundaries()) {
    const edge=new T.Group();edge.position.set(b.x,0,b.z);edge.rotation.y=b.yaw;arena.add(edge);
    box(edge,0,1.8,-.25,b.length,3.6,.5,theme.wood);
    for(let x=-b.length/2;x<=b.length/2+.01;x+=Math.max(1,b.length/Math.ceil(b.length/6))) {
      box(edge,x,2.5,-.3,.35,5,.35,wood);
      box(edge,x,A.wallHeight/2,-.3,.07,A.wallHeight,.07,0xa3ad87);
    }
    for(const y of [3.4,4.6])box(edge,0,y,-.3,b.length,.25,.25,0xccab74);
    for(let y=6;y<=A.wallHeight;y+=4)box(edge,0,y,-.3,b.length,.035,.035,0xb5bd9e);
    box(edge,0,.035,A.rampWidth+.6,b.length-.3,.04,.13,line);
    for(const section of rampSections(b)) {
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(section.points,3));geometry.setIndex(section.indices);geometry.computeVertexNormals();
      arena.add(mesh(geometry,theme.ramp));
    }
  }
  for(const side of [-1,1]) {
    const color=side===1?0xe99b60:0x69b9b5;
    const z=A.length/2,gw=A.goalWidth,gh=A.goalHeight,gd=A.goalDepth;
    box(arena,0,.04,side*(z-4),gw,.07,8,color);
    for(const x of [-gw/2-.3,gw/2+.3])box(arena,x,gh/2,side*z,.6,gh,.6,color);
    box(arena,0,gh,side*z,gw+.6,.6,.6,color);
    box(arena,0,.02,side*(z+gd/2),gw,.04,gd,0x727c55);
    for(let x=-gw/2;x<=gw/2;x+=1.5){box(arena,x,gh/2,side*(z+gd),.045,gh,.045,0xe5dfb8);box(arena,x,gh,side*(z+gd/2),.045,.045,gd,0xe5dfb8);}
    for(let y=.5;y<=gh;y+=1.5){box(arena,0,y,side*(z+gd),gw,.045,.045,0xe5dfb8);for(const x of [-gw/2,gw/2])box(arena,x,y,side*(z+gd/2),.045,.045,gd,0xe5dfb8);}
    for(const x of [-gw/2,gw/2])for(let d=0;d<=gd;d+=1.5)box(arena,x,gh/2,side*(z+d),.045,gh,.045,0xe5dfb8);
    for(let y=gh+3;y<=A.wallHeight;y+=3)box(arena,0,y,side*z,gw,.035,.035,0xb5bd9e);
    for(let x=-gw/2;x<=gw/2;x+=5.5)box(arena,x,(A.wallHeight+gh)/2,side*z,.035,A.wallHeight-gh,.035,0xb5bd9e);
  }
  // Original toy-like farm buildings and low-poly landscape.
  const barn=new T.Group(); barn.position.set(-59,0,-26); arena.add(barn);
  box(barn,0,5,0,15,10,20,id==='frostbite'?0x7d8eaa:id==='canyon'?0x905c44:0xb5573f);
  for(let x=-7;x<=7;x+=1.1) box(barn,x,5,10.03,.09,9.8,.08,0xd27856);
  const roof=mesh(new T.CylinderGeometry(11,11,23,3),0x424e45); roof.rotation.z=Math.PI/2; roof.rotation.y=Math.PI/2; roof.position.y=10.2; barn.add(roof);
  box(barn,0,3.2,10.2,7,6.4,.2,0x744d3c); for(const x of [-3.6,3.6]) box(barn,x,3.2,10.4,.3,6.6,.3,0xf1dcb2);
  box(barn,0,6.5,10.4,7.5,.35,.3,0xf1dcb2); const cross=box(barn,0,3.3,10.5,.24,9,.2,0xf1dcb2); cross.rotation.z=.81; const cross2=cross.clone(); cross2.rotation.z=-.81; barn.add(cross2);
  const silo=mesh(new T.CylinderGeometry(4,4,16,12),0xadb9ab); silo.position.set(-58,8,-48); arena.add(silo); ball(arena,-58,16,-48,4,0x889991,1).scale.y=.5;
  for(let i=0;i<22;i++) {
    const angle=i*2.399; const radius=82+(i%4)*6; const x=Math.sin(angle)*radius,z=Math.cos(angle)*radius;
    box(arena,x,2,z,.9,4,.9,0x765b40); const crown=ball(arena,x,6,z,3.6, id==='harvest'?[0xb76c34,0xc49540,0x974638][i%3]:id==='frostbite'?0x92b6b7:id==='canyon'?0x6f8061:[0x547646,0x638c4b,0x7c9953][i%3],0); crown.scale.y=1.3;
  }
  for(let i=0;i<13;i++) { const x=i%2?49:-49,z=-40+i*6; const bale=box(arena,x,1.2,z,3.4,2.4,2.3,0xd9b75d); bale.rotation.y=i*.5; for(const dx of [-.8,.8]) box(bale,dx,0,0,.12,2.45,2.35,0xa48840); }
  const mill=new T.Group(); mill.position.set(52,0,-45); arena.add(mill);
  const tower=mesh(new T.ConeGeometry(3,15,4),0xd4c8a2); tower.position.y=7.5; mill.add(tower);
  const blades=new T.Group(); blades.position.set(0,13,1); mill.add(blades);
  for(let i=0;i<4;i++) { const arm=new T.Group(); arm.rotation.z=i*Math.PI/2; box(arm,0,3.4,0,.5,7,.3,0x786a51); box(arm,.7,4.6,0,1.7,3.6,.2,0xe6dbb5); blades.add(arm); }
  ball(blades,0,0,.3,.65,0x665b49,1);
  for(let i=0;i<(id==='harvest'?0:12);i++) { const cloud=ball(arena,-80+i*15,29+i%3*5,-70,5,0xfff5dc,1); cloud.scale.set(2.5,.45,1); }
  decorateMap(arena,id,detail);
  // Batch immobile scenery by material; keep the windmill blades animated.
  arena.updateMatrixWorld(true);
  const groups=new Map<string,{geometries:T.BufferGeometry[];material:T.MeshStandardMaterial;shadow:boolean}>();
  const originals:T.Mesh[]=[];
  arena.traverse(object=>{if(!(object instanceof T.Mesh))return;let ancestor:T.Object3D|null=object;while(ancestor){if(ancestor===blades)return;ancestor=ancestor.parent;}
    const material=object.material as T.MeshStandardMaterial,color=material.color.getHex();object.geometry.computeBoundingBox();const size=object.geometry.boundingBox!.getSize(new T.Vector3()).multiply(object.scale);const shadow=Math.min(size.x,size.y,size.z)>.3&&Math.max(size.x,size.y,size.z)<50;const key=`${color}:${shadow}`;
    if(!groups.has(key))groups.set(key,{geometries:[],material:material.clone(),shadow});
    const response=groups.get(key)!.material;response.roughness=[theme.turf,theme.stripe,theme.ground,theme.ramp].includes(color as never)?1:color===0xadb9ab?.4:.8;response.metalness=color===0xadb9ab?.45:0;
    let geometry=object.geometry.clone();if(geometry.index)geometry=geometry.toNonIndexed();geometry.applyMatrix4(object.matrixWorld);geometry.deleteAttribute('uv');groups.get(key)!.geometries.push(geometry);originals.push(object);
  });
  for(const {geometries,material,shadow} of groups.values()){const geometry=mergeGeometries(geometries);if(geometry){const combined=new T.Mesh(geometry,material);combined.castShadow=shadow;combined.receiveShadow=true;arena.add(combined);}for(const g of geometries)g.dispose();}
  for(const original of originals){original.removeFromParent();original.geometry.dispose();(original.material as T.Material).dispose();}
  const atmosphere=weather(id,Math.round(180*detail));arena.add(atmosphere.points);
  return {arena,blades,atmosphere};
}
