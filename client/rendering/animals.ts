import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Animal} from '../../shared/config';
export function mesh(geometry:T.BufferGeometry,color:number){const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.8}));m.castShadow=true;m.receiveShadow=true;return m;}
export function box(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,color:number){const m=mesh(new T.BoxGeometry(w,h,d),color);m.position.set(x,y,z);parent.add(m);return m;}
export function ball(parent:T.Object3D,x:number,y:number,z:number,r:number,color:number,detail=1){const m=mesh(new T.IcosahedronGeometry(r,detail),color);m.position.set(x,y,z);parent.add(m);return m;}
export interface AnimalModel {root:T.Group;body:T.Bone;head:T.Bone;legs:T.Bone[];ears:T.Bone[];tail:T.Bone;kind:Animal;lod:T.LOD;skeleton:T.Skeleton;feet:T.Bone[];lastAnimation:number;previousSpeed:number}
/** Original, generated skinned assets. Three geometry LODs share one compact bone rig.
 * Mesh vertices are authored in bind space; no bone ever moves the competitive root. */
export function createAnimal(kind:Animal,team=0):AnimalModel {
 const root=new T.Group(),bones:T.Bone[]=[];
 const bone=(name:string,parent:T.Object3D,x=0,y=0,z=0)=>{const b=new T.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);bones.push(b);return b;};
 const rig=bone('root',root),body=bone('spine',rig),neck=bone('neck',body,0,.25,-.54),head=bone('head',neck,0,.23,-.13),tail=bone('tail',body,0,.12,.72);
 const legs:T.Bone[]=[],feet:T.Bone[]=[],ears:T.Bone[]=[];
 for(const x of [-.36,.36])for(const z of kind==='chicken'?[.1]:[-.48,.48]){const leg=bone(`leg_${legs.length}`,body,x,-.27,z);legs.push(leg);feet.push(bone(`foot_${feet.length}`,leg,0,-.42,-.02));}
 for(const x of [-1,1])ears.push(bone(kind==='chicken'?`wing_${x}`:`ear_${x}`,kind==='chicken'?body:head,x*(kind==='chicken'?.47:.35),kind==='chicken'?.03:.23,0));
 root.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);skeleton.calculateInverses();const lod=new T.LOD();root.add(lod);
 const coat=kind==='pig'?0xf2a29f:kind==='cow'?0xf7ebd0:kind==='chicken'?0xffedd0:0xc7aa86;
 const materials=[new T.MeshStandardMaterial({color:coat,roughness:.74}),new T.MeshStandardMaterial({color:0x342d29,roughness:.72}),new T.MeshStandardMaterial({color:0xfff5d9,roughness:.6}),new T.MeshStandardMaterial({color:kind==='chicken'?0xee9833:0xd6817e,roughness:.67}),new T.MeshStandardMaterial({color:team===0?0xf07638:0x27afc1,roughness:.4,metalness:.12}),new T.MeshStandardMaterial({color:0xd34b42,roughness:.7})];
 for(let level=0;level<3;level++){
  const seg=[24,12,7][level],geometries:T.BufferGeometry[][]=materials.map(()=>[]);
  const attach=(b:T.Bone,g:T.BufferGeometry,mat:number,pos:T.Vector3,sc=new T.Vector3(1,1,1),q=new T.Quaternion())=>{if(g.index)g=g.toNonIndexed();g.applyMatrix4(new T.Matrix4().compose(pos,q,sc));g.applyMatrix4(b.matrixWorld);const count=g.getAttribute('position').count,idx=new Uint16Array(count*4),weights=new Float32Array(count*4),bi=bones.indexOf(b);for(let i=0;i<count;i++){idx[i*4]=bi;weights[i*4]=1;}g.setAttribute('skinIndex',new T.Uint16BufferAttribute(idx,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometries[mat].push(g);};
  const ell=(b:T.Bone,x:number,y:number,z:number,sx:number,sy:number,sz:number,mat=0)=>attach(b,new T.SphereGeometry(1,seg,Math.max(5,Math.round(seg*.65))),mat,new T.Vector3(x,y,z),new T.Vector3(sx,sy,sz));
  const tube=(b:T.Bone,points:number[][],radius:number,mat:number)=>attach(b,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),seg,radius,level===0?8:5,false),mat,new T.Vector3());
  ell(body,0,0,0,kind==='pig'?.58:kind==='cow'?.55:.44,kind==='chicken'?.5:.4,kind==='chicken'?.54:.8);
  if(kind==='cow')ell(body,0,.13,-.35,.57,.4,.4);
  ell(neck,0,.03,0,.3,.36,.34);ell(head,0,0,-.07,kind==='cow'?.4:.32,kind==='chicken'?.4:.32,.38);
  for(let i=0;i<legs.length;i++){ell(legs[i],0,-.16,0,.12,.28,.14,kind==='chicken'?3:0);ell(feet[i],0,-.03,-.06,.145,.1,.2,kind==='chicken'?3:1);if(level===0&&kind!=='chicken')tube(feet[i],[[0,-.01,-.22],[0,-.09,-.23]],.012,0);}
  for(const x of [-1,1]){ell(head,x*.245,.06,-.31,.12,.14,.055,2);ell(head,x*.258,.065,-.358,.065,.085,.027,1);if(level<2)ell(head,x*.26-.018,.098,-.383,.023,.03,.012,2);tube(head,[[x*.16,.22,-.32],[x*.25,.23,-.32],[x*.32,.17,-.29]],.028,1);}
  if(kind==='pig'){
   ell(head,0,-.12,-.4,.27,.175,.14,3);for(const x of [-.1,.1])ell(head,x,-.1,-.531,.048,.062,.012,1);
   ears.forEach((b,i)=>{const side=i?1:-1,q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-side*.45);attach(b,new T.ConeGeometry(.22,.42,3),0,new T.Vector3(side*.07,.08,0),new T.Vector3(1,1,.5),q);attach(b,new T.ConeGeometry(.14,.28,3),3,new T.Vector3(side*.07,.08,-.075),new T.Vector3(1,1,.18),q);});
   const points=Array.from({length:25},(_,i)=>{const a=i/24*Math.PI*3;return [Math.cos(a)*.1,Math.sin(a)*.1,i*.012];});tube(tail,points,.04,3);
  }else if(kind==='chicken'){
   ell(head,0,-.05,-.44,.19,.1,.24,3);for(let i=0;i<4;i++)ell(head,0,.36,-.23+i*.13,.075,.14,.105,5);ell(head,0,-.3,-.29,.075,.14,.055,5);
   ears.forEach((b,i)=>{ell(b,(i?1:-1)*.06,-.04,.02,.12,.32,.4);if(level<2)for(let j=0;j<4;j++)ell(b,(i?1:-1)*.14,-.12+j*.07,.08+j*.04,.06,.2,.3,2);});
   for(let i=-2;i<=2;i++)ell(tail,i*.08,.2,Math.abs(i)*-.06,.065,.38,.12,i%2?1:0);
  }else{
   ell(head,0,-.18,-.32,kind==='cow'?.32:.22,.14,.19,kind==='cow'?3:2);
   ears.forEach((b,i)=>{ell(b,(i?1:-1)*.12,0,0,.24,.095,.12);ell(b,(i?1:-1)*.12,.01,-.07,.15,.045,.025,3);});
   for(const x of [-1,1])tube(head,[[x*.21,.24,.04],[x*.29,.48,.1],[x*.32,kind==='goat'?.68:.48,.25],[x*.22,kind==='goat'?.72:.51,.37]],kind==='goat'?.075:.06,2);
   if(kind==='goat'){ell(head,0,-.38,-.2,.12,.2,.08,2);ell(body,0,.3,-.18,.3,.16,.58,2);}
   else{for(const [x,y,z,s] of [[.5,.12,.18,.24],[-.5,.05,-.22,.3],[.2,.36,.2,.2],[-.19,.37,-.4,.22]])ell(body,x,y,z,s,.1,s*1.3,1);}
   tube(tail,[[0,0,0],[.03,-.13,.19],[.08,-.35,.24],[.1,-.51,.18]],.035,0);ell(tail,.1,-.51,.18,.085,.14,.075,1);
  }
  // Mouth line and a restrained team collar keep faces readable without recoloring coats.
  tube(head,[[-.12,-.23,-.43],[0,-.26,-.45],[.12,-.23,-.43]],.013,1);
  attach(neck,new T.TorusGeometry(.3,.045,6,seg),4,new T.Vector3(0,-.04,0),new T.Vector3(1,1,1),new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2));
  const groups=geometries.map(g=>g.length?mergeGeometries(g):null).filter((g):g is T.BufferGeometry=>!!g);const merged=mergeGeometries(groups,true)!;for(const group of groups)group.dispose();for(const group of geometries)for(const g of group)g.dispose();
  const skin=new T.SkinnedMesh(merged,materials);skin.name=`${kind}_LOD${level}`;skin.bind(skeleton);skin.castShadow=true;skin.receiveShadow=true;skin.frustumCulled=false;lod.addLevel(skin,[0,24,48][level]);
 }
 const ring=mesh(new T.TorusGeometry(.85,.028,5,40),team===0?0xf7a45e:0x5ed7eb);ring.rotation.x=Math.PI/2;ring.position.y=-.8;root.add(ring);
 const skin=lod.levels[0].object as T.SkinnedMesh;skin.geometry.computeBoundingBox();const bounds=skin.geometry.boundingBox!,height={goat:1.6,pig:1.45,cow:1.75,chicken:1.4}[kind],factor=height/(bounds.max.y-bounds.min.y);root.scale.setScalar(factor);root.userData.groundOffset=-bounds.min.y*factor-.42;root.userData.visualHeight=height;
 return{root,body,head,legs,ears,tail,kind,lod,skeleton,feet,lastAnimation:0,previousSpeed:0};
}
export function animateAnimal(a:AnimalModel,time:number,speed:number,boost:boolean,grounded:boolean,dodging:boolean,celebrate=false,impact=0,turn=0){
 const level=a.lod.getCurrentLevel();if(level===2&&time-a.lastAnimation<.1)return;const dt=Math.max(.016,time-a.lastAnimation),acceleration=(speed-a.previousSpeed)/dt;a.lastAnimation=time;a.previousSpeed=speed;
 const pace=time*(boost?24:Math.max(2,speed*{goat:1.8,pig:2.1,cow:1.35,chicken:2.8}[a.kind])),run=Math.min(speed/7,1);
 a.legs.forEach((b,i)=>{b.rotation.x=grounded?Math.sin(pace+(i%2)*Math.PI)*.75*run:-.65;a.feet[i].rotation.x=grounded?-Math.max(0,Math.sin(pace+i*Math.PI))*.25:.5;});
 a.body.position.y=Math.sin(pace*2)*({goat:.045,pig:.03,cow:.02,chicken:.06}[a.kind])*run+Math.sin(time*2)*.006+(celebrate?Math.abs(Math.sin(time*7))*.25:0);
 a.body.rotation.x=boost?-.13:T.MathUtils.clamp(-acceleration*.008,-.1,.15);a.body.rotation.z=T.MathUtils.clamp(turn*.07,-.15,.15)+Math.sin(time*32)*impact*.08;
 a.body.scale.set(1+impact*.08,1-impact*.13,1+impact*.04);a.head.rotation.x=!grounded?.1:Math.sin(time*2)*.035;
 a.ears.forEach((b,i)=>b.rotation.z=(i?1:-1)*(a.kind==='chicken'?Math.sin(pace)*.35+.15:Math.sin(time*(boost?22:3))*.08));a.tail.rotation.z=Math.sin(time*(boost?25:3))*.2;
 if(a.kind==='pig')a.body.rotation.z+=Math.sin(pace)*.065*run;
 if(a.kind==='cow')a.head.rotation.x+=Math.sin(pace)*.06*run;
 if(a.kind==='chicken'){a.head.position.z=-.06*Math.sin(pace)*run;a.body.rotation.x+=run*.08;}
 if(a.kind==='goat'&&speed<1)a.head.rotation.y=Math.sin(time*.8)*.12;else a.head.rotation.y=0;
}
