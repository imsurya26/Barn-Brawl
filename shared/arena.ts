import {ARENA as A} from './config';
export interface Boundary {x:number;z:number;length:number;yaw:number;normal:{x:number;z:number};ramp:boolean}
/** Ordered chamfered perimeter shared by renderer, collider builder and camera. */
export function boundaries():Boundary[]{
  const w=A.width/2,l=A.length/2,c=A.cornerCut,gw=A.goalWidth/2;
  const result:Boundary[]=[];
  function edge(x1:number,z1:number,x2:number,z2:number,ramp=true){const dx=x2-x1,dz=z2-z1,length=Math.hypot(dx,dz);result.push({x:(x1+x2)/2,z:(z1+z2)/2,length,yaw:-Math.atan2(dz,dx),normal:{x:-dz/length,z:dx/length},ramp});}
  edge(-w+c,-l,-gw,-l);edge(gw,-l,w-c,-l);edge(w,-l+c,w,l-c);edge(w-c,l,gw,l);edge(-gw,l,-w+c,l);edge(-w,l-c,-w,-l+c);
  for(const [cx,cz,start] of [[w-c,-l+c,-Math.PI/2],[w-c,l-c,0],[-w+c,l-c,Math.PI/2],[-w+c,-l+c,Math.PI]])for(let i=0;i<8;i++){const a=start+i*Math.PI/16,b=a+Math.PI/16;edge(cx+c*Math.cos(a),cz+c*Math.sin(a),cx+c*Math.cos(b),cz+c*Math.sin(b));}
  return result;
}
/** Cross-section strips approximate a smooth concave transition with continuous shared seams. */
export function rampSections(b:Boundary){
 const result:{points:number[];indices:number[]}[]=[];const segments=12;
 for(let i=0;i<segments;i++){
   const t0=i/segments,t1=(i+1)/segments;
   const d0=A.rampWidth*(1-Math.sin(t0*Math.PI/2)),d1=A.rampWidth*(1-Math.sin(t1*Math.PI/2));
   const y0=A.rampHeight*(1-Math.cos(t0*Math.PI/2)),y1=A.rampHeight*(1-Math.cos(t1*Math.PI/2));
   const tangent={x:Math.cos(b.yaw),z:-Math.sin(b.yaw)},points:number[]=[];
   for(const side of [-1,1])for(const [d,y] of [[d0,-.1],[d1,-.1],[d1,y1],[d0,y0]])points.push(b.x+tangent.x*b.length/2*side+b.normal.x*d,y,b.z+tangent.z*b.length/2*side+b.normal.z*d);
   result.push({points,indices:[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,3,7,6,3,6,2,0,4,7,0,7,3,1,2,6,1,6,5]});
 }return result;
}
