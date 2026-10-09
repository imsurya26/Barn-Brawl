import * as T from 'three';
import {box,ball,mesh} from './animals';
import type {MapId} from '../../shared/maps';
/** Decorations stay outside the standardized competitive collider shell. */
export function decorateMap(root:T.Group,id:MapId,detail:number){
 const extras=new T.Group();extras.name='environment-detail';root.add(extras);
 const lantern=(x:number,y:number,z:number)=>{box(extras,x,y-1,z,.12,2,.12,0x4d3c36);const light=box(extras,x,y,z,.48,.65,.48,0xffc470);(light.material as T.MeshStandardMaterial).emissive.setHex(0xff942b);(light.material as T.MeshStandardMaterial).emissiveIntensity=2;box(extras,x,y+.39,z,.65,.12,.65,0x332e37);};
 if(id==='harvest'){
  const moon=ball(extras,-45,53,-95,12,0xffdb91,3);(moon.material as T.MeshStandardMaterial).emissive.setHex(0xffd699);(moon.material as T.MeshStandardMaterial).emissiveIntensity=.7;
  for(let i=0;i<24;i++){const x=i%2?50:-50,z=-50+Math.floor(i/2)*9;lantern(x,6,z);const pumpkin=ball(extras,x+(i%3),.6,z+2,.7,0xe68b32,2);pumpkin.scale.set(1,.8,1);box(extras,x+(i%3),1.2,z+2,.12,.3,.12,0x635436);}
  for(let i=0;i<3;i++){const house=new T.Group();house.position.set(-75+i*50,0,-85);extras.add(house);box(house,0,3,0,9,6,8,0x765445);const roof=mesh(new T.ConeGeometry(7,4,4),0x4a3440);roof.position.y=8;roof.rotation.y=Math.PI/4;house.add(roof);lantern(-75+i*50,4,-80);}
 }else if(id==='frostbite'){
  for(let i=0;i<14;i++){const x=-120+i*19,z=-100-(i%3)*15,h=25+(i%5)*8;const mountain=mesh(new T.ConeGeometry(19,h,6),0x667d98);mountain.position.set(x,h/2,z);extras.add(mountain);const snow=mesh(new T.ConeGeometry(11,h*.53,6),0xe6edf0);snow.position.set(x,h*.735,z);extras.add(snow);}
  for(let i=0;i<18;i++){const x=i%2?55+i%4*5:-55-i%4*5,z=-65+i*8;box(extras,x,1.5,z,.8,3,.8,0x6c5b51);for(let j=0;j<3;j++){const pine=mesh(new T.ConeGeometry(3-j*.5,4,8),j%2?0xd8e6e9:0x385e64);pine.position.set(x,4+j*2,z);extras.add(pine);}}
  for(let i=0;i<12;i++){const icicle=mesh(new T.ConeGeometry(.25,2,6),0xc0eaff);icicle.rotation.z=Math.PI;icicle.position.set(-49,8,-34+i*1.4);extras.add(icicle);}
  for(const x of [-80,80]){box(extras,x,10,-85,.8,20,.8,0x63758a);box(extras,x,20,-85,7,.6,.6,0x63758a);}box(extras,0,20,-85,160,.04,.04,0x6e8197);for(const x of [-65,-25,15,55]){box(extras,x,18.3,-85,.08,3,.08,0x61738a);box(extras,x,16.6,-85,2,1,1.3,0xd58463);}
 }else if(id==='canyon'){
  for(let i=0;i<16;i++){const x=-125+i*18,z=-90-(i%3)*15,h=18+(i%5)*5;const mesa=mesh(new T.CylinderGeometry(8,13,h,7),i%2?0x985239:0xb76540);mesa.position.set(x,h/2,z);extras.add(mesa);box(extras,x,h*.72,z,17,2,15,0xd48958);}
  const tank=mesh(new T.CylinderGeometry(4,4,5,16),0x83948d);tank.position.set(62,15,5);extras.add(tank);for(const dx of [-2.5,2.5])for(const dz of [-2.5,2.5])box(extras,62+dx,6.5,5+dz,.4,13,.4,0x705443);
  for(let i=0;i<16;i++){const x=i%2?51+i%4*3:-51-i%4*3,z=-57+i*8;box(extras,x,2,z,.7,4,.7,0x5f8062);box(extras,x+.8,2.8,z,1.7,.55,.6,0x5f8062);box(extras,x+1.4,3.5,z,.5,1.6,.55,0x5f8062);}
 }else{
  const tractor=new T.Group();tractor.position.set(54,0,18);extras.add(tractor);box(tractor,0,1.5,0,2,1.7,4,0x488964);box(tractor,0,3,.9,2,1.7,1.6,0x43806a);box(tractor,0,4,.9,2.6,.2,2,0xe3d4a2);for(const x of [-1.15,1.15])for(const z of [-1.2,1.2]){const tire=mesh(new T.CylinderGeometry(z>0?1:.7,z>0?1:.7,.6,14),0x363d35);tire.rotation.z=Math.PI/2;tire.position.set(x,z>0?1:.7,z);tractor.add(tire);}
  for(let row=0;row<5;row++)for(let i=0;i<30;i++){const stalk=box(extras,-65+row*.9,.8,-45+i*2,.05,1.6,.05,0xc1a24b);ball(stalk,0,.8,0,.13,0xe1c368,0).scale.y=2;}
  for(let i=0;i<6;i++){const hill=ball(extras,-100+i*40,0,-110,25,i%2?0x5f916b:0x74986c,2);hill.scale.y=.6;}
 }
 for(const side of [-1,1]){
  const z=side*59;
  if(id==='harvest'){for(const x of [-12,12])lantern(x,7,z);box(extras,0,10,z,25,.7,.7,0x83563b);}
  if(id==='frostbite'){box(extras,0,9.7,z,24,.5,2,0xe5f2f4);for(let i=-10;i<=10;i+=2){const ice=mesh(new T.ConeGeometry(.14,.6,5),0xbbecff);ice.rotation.z=Math.PI;ice.position.set(i,9.5,z);extras.add(ice);}}
  if(id==='canyon'){box(extras,0,10.4,z,25,.7,1,0x754e3c);for(const x of [-12,12])box(extras,x,5,z,.9,10,1,0x836b52);}
 }
 // Original farm club stands, team banners and a batched low-detail crowd.
 for(const side of [-1,1]){
  box(extras,side*53,1,0,8,2,55,0x605647);box(extras,side*56,3,0,5,2,55,0x806952);
  for(let i=0;i<20*detail;i++){const z=-25+i/(20*detail)*50;const person=ball(extras,side*54,3.3,z,.42,i%2?0xe9a16c:0x70b8c6,0);person.scale.y=1.3;ball(extras,side*54,4,z,.25,0xe7c99f,1);}
  for(const z of [-24,24]){box(extras,side*49,7,z,.2,14,.2,0x696854);box(extras,side*49,11,z,3,4,.1,z>0?0xf09553:0x52b8c5);}
 }
 return extras;
}
export function weather(id:MapId,amount:number){
 const count=id==='frostbite'?amount:id==='harvest'?Math.round(amount*.4):0,positions=new Float32Array(count*3);
 for(let i=0;i<count;i++){positions[i*3]=Math.sin(i*73.7)*75;positions[i*3+1]=(i*1.37)%30;positions[i*3+2]=Math.cos(i*24.1)*75;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));const points=new T.Points(g,new T.PointsMaterial({color:id==='frostbite'?0xecf7ff:0xeab763,size:id==='frostbite'?.12:.15,transparent:true,opacity:.65,depthWrite:false}));points.name='weather';
 return {points,update(dt:number){for(let i=0;i<count;i++){positions[i*3+1]-=dt*(id==='frostbite'?1:.45);if(positions[i*3+1]<0)positions[i*3+1]=30;}g.attributes.position.needsUpdate=true;}};
}
