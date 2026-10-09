import {ABILITIES,GAMEPLAY as G,POWERUPS,POWERUP_INFO,createPickups,newGameplay,type EventKind,type MatchEvent} from '../shared/gameplay';
import {ARENA,PLAYER,ROCK,RULES} from '../shared/config';
import {rotate,scale,plus,length,normalize} from '../shared/controller';
import type {Room,Player} from './room';
import type {Vec} from '../shared/protocol';
export class MatchSystems {
 pickups=createPickups();events:MatchEvent[]=[];serial=0;cycle=0;scorerId?:string;assistId?:string;mvpId?:string;
 ramHits=new Set<string>();largestDeficit=[0,0];touches:{id:string;tick:number}[]=[];oldRock:Vec={x:0,y:0,z:0};oldVel=new Map<string,Vec>();lastShot=new Map<string,number>();
 constructor(private room:Room){}
 emit(kind:EventKind,p?:Player,detail?:string){const pos=p?.body.translation();this.events.push({id:++this.serial,tick:this.room.tick,kind,playerId:p?.id,name:p?.nickname,team:p?.team,detail,...pos});if(this.events.length>32)this.events.shift();}
 reset(){this.pickups=createPickups();this.events=[];this.ramHits.clear();this.largestDeficit=[0,0];this.touches=[];this.lastShot.clear();this.scorerId=this.assistId=this.mvpId=undefined;for(const p of this.room.players.values())p.game=newGameplay();}
 pause(){for(const p of this.room.players.values()){p.lastJumpId=p.input.jumpId??p.lastJumpId;p.jumpHeld=p.input.jump;p.game.useHeld=!!p.input.usePower;p.game.abilityHeld=!!p.input.useAbility;}}
 phase(next:string){if(next==='PLAYING')this.emit('KICKOFF');if(next==='OVERTIME')this.emit('OVERTIME');if(next==='MATCH_END'){const ps=[...this.room.players.values()];ps.sort((a,b)=>this.points(b)-this.points(a)||a.id.localeCompare(b.id));this.mvpId=ps[0]?.id;this.emit('MATCH_VICTORY',ps.find(p=>p.team===(this.room.score[0]>this.room.score[1]?0:1)));}}
 points(p:Player){const s=p.game.stats;return s.goals*100+s.assists*50+s.saves*60+s.shots*10;}
 push(body:Player['body'],dv:Vec){body.applyImpulse(scale(dv,body.mass()),true);}
 pulse(p:Player,radius:number,playerForce:number,rockForce:number){const center=p.body.translation();for(const q of this.room.players.values()){if(q===p||q.team===p.team)continue;const d=plus(q.body.translation(),scale(center,-1)),dist=length(d);if(dist<radius)this.push(q.body,scale(normalize({...d,y:.3}),playerForce*(1-dist/radius)*(q.game.activePower==='shield'?G.shieldScale:1)));}const rock=this.room.physics.rock,d=plus(rock.translation(),scale(center,-1)),dist=length(d);if(dist<radius){this.push(rock,scale(normalize({...d,y:.4}),rockForce*(1-dist/radius)));this.touch(p);}}
 touch(p:Player){if(this.touches.at(-1)?.id!==p.id)this.touches.push({id:p.id,tick:this.room.tick});else this.touches[this.touches.length-1].tick=this.room.tick;this.touches=this.touches.filter(t=>this.room.tick-t.tick<G.touchWindow*RULES.tick).slice(-12);}
 before(dt:number){
  const r=this.room;this.oldRock={...r.physics.rock.linvel()};
  for(const item of this.pickups){if(item.remaining>0){item.remaining=Math.max(0,item.remaining-dt);if(item.remaining===0&&item.kind==='power'){item.power=POWERUPS[Math.floor(r.tick/(G.powerRespawn*RULES.tick))%POWERUPS.length];this.emit('POWERUP_SPAWN',undefined,item.power);}}}
  for(const p of r.players.values()){
   const g=p.game;this.oldVel.set(p.id,{...p.body.linvel()});const oldCooldown=g.abilityCooldown;g.abilityCooldown=Math.max(0,g.abilityCooldown-dt);if(oldCooldown>0&&g.abilityCooldown===0)this.emit('ABILITY_READY',p,ABILITIES[p.animal].name);
   g.powerTime=Math.max(0,g.powerTime-dt);if(!g.powerTime){g.activePower=null;g.shotBonus=false;}
   const previous=g.abilityTime;g.abilityTime=Math.max(0,g.abilityTime-dt);
   if(g.abilityPhase==='WINDUP'&&previous>0&&!g.abilityTime){if(p.grounded)this.pulse(p,G.cowRange,G.cowPlayer,G.cowRock);g.abilityPhase='IDLE';}
   if(g.abilityPhase==='AIRBORNE'&&p.grounded&&g.abilityTime<1.85){this.pulse(p,G.pigRange,G.pigPlayer,G.pigRock);g.abilityPhase='IDLE';g.abilityTime=0;}
   if(!g.abilityTime){g.abilityPhase='IDLE';g.ramBonus=false;}
   if(p.socket){
    const pos=p.body.translation();for(const item of this.pickups){if(item.remaining||pos.y>G.pickupHeight||Math.hypot(pos.x-item.x,pos.z-item.z)>G.pickupRadius)continue;if(item.kind==='power'){if(g.item)continue;g.item=item.power!;item.remaining=G.powerRespawn;this.emit('POWERUP_COLLECTED',p,item.power);}else{if(p.boost>=100)continue;p.boost=Math.min(100,p.boost+(item.kind==='large'?100:G.smallBoost));item.remaining=item.kind==='large'?G.largeRespawn:G.smallRespawn;}}
    if(p.input.usePower&&!g.useHeld&&g.item){const item=g.item;g.item=null;g.activePower=item;g.powerTime=POWERUP_INFO[item].duration;g.shotBonus=item==='power-shot';g.stats.powerups++;this.emit('POWERUP_USED',p,item);if(item==='shockwave')this.pulse(p,G.shockRange,G.shockPlayer,G.shockRock);}
    if(p.input.useAbility&&!g.abilityHeld&&!g.abilityCooldown&&(p.animal!=='cow'||p.grounded)&&(p.animal!=='pig'||p.grounded)){
     const ability=ABILITIES[p.animal];g.abilityCooldown=ability.cooldown;g.abilityTime=ability.duration;g.abilityPhase=p.animal==='cow'?'WINDUP':p.animal==='pig'?'AIRBORNE':'ACTIVE';g.ramBonus=p.animal==='goat';for(const key of this.ramHits)if(key.startsWith(p.id+':'))this.ramHits.delete(key);g.stats.abilities++;this.emit('ABILITY_USED',p,ability.name);
     if(p.animal==='pig'){this.push(p.body,{x:0,y:G.pigHop,z:0});p.jumpLock=.15;p.grounded=false;}
    }
   }
   g.useHeld=!!p.input.usePower;g.abilityHeld=!!p.input.useAbility;
   const f=rotate(p.body.rotation(),{x:0,y:0,z:-1}),speed=length(p.body.linvel());
   if(speed<PLAYER.speedSafety){if(g.activePower==='speed-surge')this.push(p.body,scale(f,Math.min(G.surgeAccel*dt,PLAYER.speedSafety-speed)));if(g.abilityTime&&p.animal==='goat')this.push(p.body,scale(f,Math.min(G.ramAccel*dt,PLAYER.speedSafety-speed)));}
   if(g.abilityTime&&p.animal==='chicken'&&!p.grounded){this.push(p.body,{x:f.x*G.chickenForward*dt,y:G.chickenLift*dt,z:f.z*G.chickenForward*dt});r.physics.torque(p.body,scale(p.angularDelta,.35));}
   if(g.activePower==='magnet'){const delta=plus(p.body.translation(),scale(r.physics.rock.translation(),-1)),dist=length(delta);if(dist>1.5&&dist<G.magnetRange)this.push(r.physics.rock,scale(normalize(delta),G.magnetAccel*dt*(1-dist/G.magnetRange)));}
  }
 }
 after(hits:number[]){const r=this.room,rock=r.physics.rock;
  for(const p of r.players.values()){
   const g=p.game;
   if(p.animal==='goat'&&g.abilityTime>0)for(const q of r.players.values()){const key=p.id+':'+q.id;if(q===p||q.team===p.team||this.ramHits.has(key))continue;r.physics.world.contactPair(p.body.collider(0),q.body.collider(0),m=>{if(m.numSolverContacts()){this.ramHits.add(key);this.push(q.body,scale(normalize(plus(q.body.translation(),scale(p.body.translation(),-1))),G.ramKnockback*(q.game.activePower==='shield'?G.shieldScale:1)));}});}
   if(hits.includes(p.body.handle)){const hit=r.physics.impacts.get(p.body.handle)!;if(hit.approach>1){this.touch(p);const bonus=(g.shotBonus?G.powerShotBonus:0)+(g.ramBonus?G.ramBonus:0);if(bonus){this.push(rock,scale(hit.direction,bonus));g.shotBonus=g.ramBonus=false;if(g.activePower==='power-shot'){g.activePower=null;g.powerTime=0;}}
    const v=rock.linvel(),pos=rock.translation(),sign=p.team===0?-1:1,target=sign*ARENA.length/2,t=(target-pos.z)/v.z;
    if(t>0&&t<5&&Math.abs(pos.x+v.x*t)<ARENA.goalWidth/2&&length(v)>G.shotMin&&(r.tick-(this.lastShot.get(p.id)??-1000))>RULES.tick*2){g.stats.shots++;this.lastShot.set(p.id,r.tick);this.emit('STRONG_SHOT',p);if(Math.abs(target-pos.z)>40)this.emit('LONG_SHOT',p);if(pos.y>4)this.emit('AERIAL_HIT',p);}
    const own=-target,ot=(own-pos.z)/this.oldRock.z,nt=(own-pos.z)/v.z;
    if(ot>0&&ot<G.saveHorizon&&Math.abs(pos.x+this.oldRock.x*ot)<ARENA.goalWidth/2-ROCK.radius&&pos.y+this.oldRock.y*ot+.5*RULES.gravity*ot*ot<ARENA.goalHeight-ROCK.radius&&(nt<=0||nt>G.saveHorizon||Math.abs(pos.x+v.x*nt)>ARENA.goalWidth/2)){g.stats.saves++;this.emit('SAVE_AWARDED',p);if(ot<.6)this.emit('BIG_SAVE',p);}
   }}
   // Shield attenuates only animal collision deltas; rock and suspension remain physical.
   if(g.activePower==='shield'){let contact=false;for(const q of r.players.values())if(q!==p)r.physics.world.contactPair(p.body.collider(0),q.body.collider(0),m=>{if(m.numSolverContacts())contact=true;});const old=this.oldVel.get(p.id);if(contact&&old){const delta=plus(p.body.linvel(),scale(old,-1));this.push(p.body,scale(delta,G.shieldScale-1));}}
  }
 }
 goal(team:0|1){const r=this.room,last=this.touches.at(-1),scorer=last&&r.tick-last.tick<G.touchWindow*RULES.tick?r.players.get(last.id):undefined;this.scorerId=scorer?.team===team?scorer.id:undefined;this.assistId=undefined;const credited=this.scorerId?scorer:undefined;
 this.emit('GOAL_SCORED',credited,credited?'Goal':'Team goal');if(credited){credited.game.stats.goals++;const possession=[];for(const t of [...this.touches].reverse()){if(r.players.get(t.id)?.team!==team)break;possession.push(t);}const touch=possession.find(t=>t.id!==credited.id&&r.tick-t.tick<=G.assistWindow*RULES.tick);const assist=touch&&r.players.get(touch.id);if(assist){assist.game.stats.assists++;this.assistId=assist.id;this.emit('ASSIST_AWARDED',assist);}if(credited.game.stats.goals===3)this.emit('HAT_TRICK',credited);}
 for(const t of [0,1])this.largestDeficit[t]=Math.max(this.largestDeficit[t],r.score[1-t]-r.score[t]);if(r.score[team]>=r.score[1-team]&&this.largestDeficit[team]>=2){this.emit('COMEBACK',credited);this.largestDeficit[team]=0;}this.touches=[];
 }
}
