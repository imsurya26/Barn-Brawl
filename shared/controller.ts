import {PLAYER as P,RULES} from './config';
import type {Input,Vec} from './protocol';
export type Quat={x:number;y:number;z:number;w:number};
export interface MotorState {
 yaw:number;pitch:number;roll:number;yawRate:number;pitchRate:number;rollRate:number;
 rotation:Quat;angularVelocity:Vec;angularDelta:Vec;probeCount:number;
 boost:number;boosting:boolean;grounded:boolean;groundNormal:Vec;
 lastJumpId:number;jumpHeld:boolean;jumpLock:number;coyote:number;airTime:number;jumpTime:number;jumpState:'GROUND'|'JUMP'|'AIR'|'DOUBLE'|'DODGE';
 dodgeAvailable:boolean;dodging:number;dodgeX:number;dodgeZ:number;dodgeAxis:Vec;slide:number;
}
export const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export const dot=(a:Vec,b:Vec)=>a.x*b.x+a.y*b.y+a.z*b.z;
export const length=(v:Vec)=>Math.hypot(v.x,v.y,v.z);
export const normalize=(v:Vec):Vec=>{const n=length(v)||1;return{x:v.x/n,y:v.y/n,z:v.z/n};};
export const cross=(a:Vec,b:Vec):Vec=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
export const scale=(v:Vec,n:number):Vec=>({x:v.x*n,y:v.y*n,z:v.z*n});
export const plus=(a:Vec,b:Vec):Vec=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
export function rotate(q:Quat,v:Vec):Vec {const u={x:q.x,y:q.y,z:q.z},t=scale(cross(u,v),2);return plus(v,plus(scale(t,q.w),cross(u,t)));}
export const heading=(yaw:number,pitch=0):Vec=>({x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)});
export function attitude(yaw:number,pitch:number,roll:number):Quat {const sx=Math.sin(pitch/2),cx=Math.cos(pitch/2),sy=Math.sin(yaw/2),cy=Math.cos(yaw/2),sz=Math.sin(roll/2),cz=Math.cos(roll/2);return{x:sx*cy*cz+cx*sy*sz,y:cx*sy*cz-sx*cy*sz,z:cx*cy*sz-sx*sy*cz,w:cx*cy*cz+sx*sy*sz};}
export function integrateRotation(q:Quat,w:Vec,dt:number):Quat {const n=length(w);if(n<1e-8)return {...q};const s=Math.sin(n*dt/2)/n,d={x:w.x*s,y:w.y*s,z:w.z*s,w:Math.cos(n*dt/2)};return{x:d.w*q.x+d.x*q.w+d.y*q.z-d.z*q.y,y:d.w*q.y-d.x*q.z+d.y*q.w+d.z*q.x,z:d.w*q.z+d.x*q.y-d.y*q.x+d.z*q.w,w:d.w*q.w-d.x*q.x-d.y*q.y-d.z*q.z};}
export function syncAttitude(m:MotorState,q:Quat,w:Vec){m.rotation={...q};m.angularVelocity={...w};const f=rotate(q,{x:0,y:0,z:-1}),r=rotate(q,{x:1,y:0,z:0}),u=rotate(q,{x:0,y:1,z:0});m.yaw=Math.atan2(-f.x,-f.z);m.pitch=Math.asin(clamp(f.y,-1,1));m.roll=Math.atan2(r.y,u.y);m.yawRate=w.y;m.pitchRate=dot(w,r);m.rollRate=-dot(w,f);}
export const newMotor=(yaw=0):MotorState=>({yaw,pitch:0,roll:0,yawRate:0,pitchRate:0,rollRate:0,rotation:attitude(yaw,0,0),angularVelocity:{x:0,y:0,z:0},angularDelta:{x:0,y:0,z:0},probeCount:0,boost:100,boosting:false,grounded:false,groundNormal:{x:0,y:1,z:0},lastJumpId:0,jumpHeld:false,jumpLock:0,coyote:0,airTime:0,jumpTime:0,jumpState:'GROUND',dodgeAvailable:true,dodging:0,dodgeX:0,dodgeZ:1,dodgeAxis:{x:1,y:0,z:0},slide:0});
export function curve(points:readonly(readonly[number,number])[],v:number){for(let i=1;i<points.length;i++)if(v<=points[i][0]){const [x,a]=points[i-1],[y,b]=points[i];return a+(b-a)*clamp((v-x)/(y-x),0,1);}return points[points.length-1][1];}
export const engineAcceleration=(speed:number)=>curve(P.throttleCurve,Math.max(0,speed));
export const steeringRate=(speed:number)=>Math.abs(speed)/curve(P.steeringCurve,Math.abs(speed));
/** Pure motor: linear and angular velocity increments. Rapier applies these as impulses;
 * rotation is always integrated by the rigid body, never assigned by this controller. */
export function stepMotor(m:MotorState,input:Input,velocity:Vec,dt:number):Vec {
 let dv={x:0,y:0,z:0},angular={x:0,y:0,z:0};const add=(v:Vec,n:number)=>{dv=plus(dv,scale(v,n));};
 const up=rotate(m.rotation,{x:0,y:1,z:0}),forward=rotate(m.rotation,{x:0,y:0,z:-1}),right=rotate(m.rotation,{x:1,y:0,z:0}),w=m.angularVelocity;
 m.jumpLock=Math.max(0,m.jumpLock-dt);m.dodging=Math.max(0,m.dodging-dt);m.slide+=(Number(input.powerslide??false)-m.slide)*(1-Math.exp(-P.gripResponse*dt));
 if(m.grounded&&m.jumpLock===0){m.coyote=P.coyoteTime;m.airTime=0;m.dodgeAvailable=true;m.jumpState='GROUND';m.jumpTime=0;}else{m.coyote=Math.max(0,m.coyote-dt);m.airTime+=dt;}
 const pressed=input.jumpId===undefined?input.jump&&!m.jumpHeld:input.jumpId>m.lastJumpId;m.lastJumpId=input.jumpId??m.lastJumpId;m.jumpHeld=input.jump;
 if(pressed&&m.coyote>0&&m.jumpLock===0){add(up,P.jumpImpulse);m.grounded=false;m.coyote=0;m.jumpLock=P.jumpLock;m.jumpTime=0;m.airTime=0;m.jumpState='JUMP';}
 else if(pressed&&!m.grounded&&m.dodgeAvailable&&m.airTime<P.dodgeWindow){
  m.dodgeAvailable=false;const direction=Math.hypot(input.throttle,input.steer);
  if(direction<.2){add(up,P.jumpImpulse);m.jumpState='DOUBLE';}
  else{m.dodgeX=input.steer/direction;m.dodgeZ=input.throttle/direction;add(forward,m.dodgeZ*P.dodgeImpulse);add(right,m.dodgeX*P.dodgeImpulse);m.dodgeAxis=normalize(plus(scale(right,-m.dodgeZ),scale(forward,-m.dodgeX)));m.dodging=P.dodgeDuration;m.jumpState='DODGE';}
 }
 if(m.jumpState==='JUMP'){if(input.jump&&m.jumpTime<P.jumpHoldTime)add(up,P.jumpHoldAcceleration*Math.min(dt,P.jumpHoldTime-m.jumpTime));m.jumpTime+=dt;if(!input.jump||m.jumpTime>=P.jumpHoldTime)m.jumpState='AIR';}
 const fraction=Math.min(1,m.boost/(RULES.boostDrain*dt));m.boosting=input.boost&&fraction>0;
 if(m.boosting)m.boost=Math.max(0,m.boost-RULES.boostDrain*dt);else if(!input.boost)m.boost=Math.min(100,m.boost+RULES.boostRegen*dt);
 if(m.grounded){
  const n=m.groundNormal,f=normalize(plus(forward,scale(n,-dot(forward,n)))),r=normalize(cross(f,n));const speed=dot(velocity,f),side=dot(velocity,r);
  const yaw=-input.steer*steeringRate(speed)*Math.sign(speed)*(1+m.slide*(P.powerslideYaw-1));
  const tilt=cross(up,n),offAxis=plus(w,scale(n,-dot(w,n)));
  angular=plus(scale(n,(yaw-dot(w,n))*P.steeringResponse),plus(scale(tilt,P.angularStability),scale(offAxis,-P.angularDamping)));
  const grip=P.lateralGrip+(P.powerslideGrip-P.lateralGrip)*m.slide;
  add(r,clamp(-side*(1-Math.exp(-grip*dt)),-P.maxLateralAccel*dt,P.maxLateralAccel*dt));
  // Curvature feed-forward bends momentum with the yaw servo; drift blends it away.
  add(r,-speed*dot(w,n)*dt*(1-m.slide));
  let a=0;if(input.throttle>0)a=speed<-.1?Math.min(P.brakeForce,-speed/dt):engineAcceleration(speed);
  else if(input.throttle<0)a=speed>.1?-Math.min(P.brakeForce,speed/dt):speed>-P.reverseMaxSpeed?-engineAcceleration(-speed):0;
  else if(!m.boosting)a=-Math.sign(speed)*Math.min(P.coastDrag,Math.abs(speed)/dt);
  add(f,a*dt);if(m.boosting)add(forward,Math.min(P.boostAcceleration*fraction*dt,Math.max(0,P.boostMaxSpeed-dot(plus(velocity,dv),forward))));
 }else{
  const intentionalAir=m.jumpState!=='GROUND'||m.airTime>.25;
  angular=plus(scale(right,(intentionalAir?(input.pitch??-input.throttle):0)*P.airPitch),plus(scale(up,-(input.yaw??input.steer)*P.airYaw),scale(forward,(intentionalAir?(input.roll??0):0)*P.airRoll)));
  angular=plus(angular,scale(w,-P.airResponse));
  if(m.dodging>0){const cancel=m.dodgeZ>0&&(input.pitch??-input.throttle)>.3;const target=scale(m.dodgeAxis,cancel?0:P.dodgeAngularSpeed);angular=scale(plus(target,scale(w,-1)),P.dodgeServo);}
  if(m.boosting)add(forward,Math.min(P.airBoostAcceleration*fraction*dt,Math.max(0,P.boostMaxSpeed-dot(plus(velocity,dv),forward))));
 }
 const cap=m.dodging>0?P.dodgeAngularSpeed:P.maxAngularSpeed,proposed=plus(w,scale(angular,dt));if(length(proposed)>cap)angular=scale(plus(scale(normalize(proposed),cap),scale(w,-1)),1/dt);
 m.angularDelta=scale(angular,dt);
 const next=plus(velocity,dv),speed=length(next);if(speed>P.speedSafety){const target=P.speedSafety+(speed-P.speedSafety)*Math.exp(-P.speedLimitResponse*dt);dv=plus(dv,scale(next,target/speed-1));}
 return dv;
}
