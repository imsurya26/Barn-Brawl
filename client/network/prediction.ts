import {ARENA,PLAYER,RULES} from '../../shared/config';
import {stepMotor,length,integrateRotation,syncAttitude,plus} from '../../shared/controller';
import type {Input,PlayerState,Snapshot,Vec} from '../../shared/protocol';
const copy=(p:PlayerState):PlayerState=>({...p,rotation:{...p.rotation},angularVelocity:{...p.angularVelocity},angularDelta:{...p.angularDelta},dodgeAxis:{...p.dodgeAxis},position:{...p.position},velocity:{...p.velocity},groundNormal:{...p.groundNormal}});
/** Fixed-step motor prediction with acknowledged-input replay. Contacts remain server-owned.
 * History and extrapolation are bounded; outage cannot create unlimited speculative travel. */
export class LocalPrediction {
 state?:PlayerState;correction:Vec={x:0,y:0,z:0};accumulator=0;age=0;safe=false;history:Input[]=[];
 receive(player:PlayerState,snapshot:Snapshot,reset=false){
  const old=this.state,previous=old?plus(old.position,this.correction):player.position,rock=snapshot.rock.position;
  this.safe=!player.game?.abilityTime&&!player.game?.powerTime&&Math.hypot(player.position.x-rock.x,player.position.z-rock.z)>5&&snapshot.players.every(p=>p.id===player.id||Math.hypot(p.position.x-player.position.x,p.position.z-player.position.z)>4)&&Math.abs(player.position.x)<ARENA.width/2-6&&Math.abs(player.position.z)<ARENA.length/2-6;
  this.history=reset||!this.safe?[]:this.history.filter(i=>i.seq>player.seq).slice(-24);
  this.state=copy(player);for(const input of this.history)this.integrate(input);
  const error={x:previous.x-this.state.position.x,y:previous.y-this.state.position.y,z:previous.z-this.state.position.z};
  this.correction=!reset&&this.safe&&length(error)<2?error:{x:0,y:0,z:0};this.accumulator=0;this.age=0;
 }
 integrate(input:Input){
  const p=this.state!,step=1/RULES.tick,change=stepMotor(p,input,p.velocity,step);
  const w=plus(p.angularVelocity,p.angularDelta);syncAttitude(p,integrateRotation(p.rotation,w,step),w);
  p.velocity.x+=change.x;p.velocity.y+=change.y+RULES.gravity*step;p.velocity.z+=change.z;
  p.position.x+=p.velocity.x*step;p.position.y+=p.velocity.y*step;p.position.z+=p.velocity.z*step;
  const floor=PLAYER.suspensionRest-PLAYER.mass*(-RULES.gravity+PLAYER.groundAdhesion)/(4*PLAYER.suspensionStiffness);
  if(p.position.y<floor){p.position.y=floor;p.velocity.y=0;p.grounded=p.jumpLock<=0;}
 }
 advance(dt:number,input:Input){
  if(!this.state)return undefined;this.age+=dt;this.accumulator+=Math.min(dt,.05);
  while(this.accumulator>=1/RULES.tick){this.accumulator-=1/RULES.tick;if(this.age>.2||!this.safe)continue;this.integrate(input);this.history.push({...input});if(this.history.length>24)this.history.shift();}
  const fade=Math.exp(-18*dt);this.correction.x*=fade;this.correction.y*=fade;this.correction.z*=fade;
  return {...this.state,position:plus(this.state.position,this.correction)};
 }
 clear(){this.state=undefined;this.correction={x:0,y:0,z:0};this.accumulator=0;this.history=[];this.safe=false;}
}
