import {MatchSystems} from './gameplay';
import {newGameplay,type GameplayState} from '../shared/gameplay';
import {MAPS,type MapId} from '../shared/maps';
import { randomBytes, randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import { RULES, ARENA, PLAYER, ROCK, type Animal } from '../shared/config';
import {newMotor,syncAttitude,type MotorState} from '../shared/controller';
import { idleInput, type Input, type Phase, type PlayerState, type Snapshot, type ServerMessage } from '../shared/protocol';
import { ArenaPhysics, type RAPIER } from './physics';
export interface Player extends MotorState { game:GameplayState;ping?:number; id: string; token: string; nickname: string; animal: Animal; boostStyleId: string; team: 0|1; ready: boolean; socket?: WebSocket; disconnectedAt: number; body: RAPIER.RigidBody; input: Input; inputAt: number;processedSeq:number }
export function send(socket: WebSocket | undefined, message: ServerMessage) { if (socket?.readyState === 1 && socket.bufferedAmount < 256000) socket.send(JSON.stringify(message)); }
const transitions: Record<Phase, Phase[]> = { LOBBY:['COUNTDOWN'], COUNTDOWN:['PLAYING','OVERTIME','LOBBY'], PLAYING:['GOAL_PAUSE','OVERTIME','MATCH_END','LOBBY'], GOAL_PAUSE:['COUNTDOWN','MATCH_END','LOBBY'], OVERTIME:['GOAL_PAUSE','MATCH_END','LOBBY'], MATCH_END:['COUNTDOWN','LOBBY'] };
export class Room {
  systems=new MatchSystems(this);tickMs=0;mapId:MapId='barnyard';
  selectMap(requester:string,id:MapId){if(requester!==this.host)throw new Error('Only the host can select the map.');if(this.phase!=='LOBBY')throw new Error('Select the map in the lobby.');if(!MAPS.some(m=>m.id===id))throw new Error('Unknown map.');this.mapId=id;for(const p of this.players.values())p.ready=false;}
  physics = new ArenaPhysics(); players = new Map<string,Player>(); host = ''; phase: Phase = 'LOBBY';
  score: [number,number] = [0,0]; remaining: number = RULES.duration; countdown = 0; overtime = false; goalTeam = -1; eventId = 0; tick = 0; emptySince = Date.now();
  constructor(public code: string, public duration:number=RULES.duration,public debugEnabled=false) {this.remaining=duration;}
  transition(next: Phase) { if (!transitions[this.phase].includes(next)) throw new Error(`Invalid transition ${this.phase} → ${next}`); this.phase = next; this.eventId++;this.systems.phase(next); }
  add(nickname: string, animal: Animal, boostStyleId: string, socket?: WebSocket) {
    if (this.players.size >= RULES.maxPlayers) throw new Error('This room is full.');
    if (this.phase !== 'LOBBY') throw new Error('Match already started. Join when the room returns to the lobby.');
    const list = [...this.players.values()];
    const team: 0|1 = list.filter(p=>p.team===0).length <= list.filter(p=>p.team===1).length ? 0 : 1;
    const p: Player = { ...newMotor(team===0?0:Math.PI),game:newGameplay(), id: randomUUID(), token: randomBytes(24).toString('hex'), nickname, animal, boostStyleId, team, ready: false, socket, disconnectedAt: 0, body: this.physics.createPlayer({x:0,y:2,z:0}), input:idleInput(), inputAt: Date.now(),processedSeq:0 };
    this.players.set(p.id,p); if (!this.host) this.host=p.id; this.resetPositions(); this.emptySince=0;
    return p;
  }
  broadcast(message: ServerMessage) { for(const p of this.players.values()) send(p.socket,message); }
  disconnect(p: Player, now = Date.now()) {
    p.socket=undefined; p.disconnectedAt=now; p.input=idleInput(); p.boosting=false;
    if(this.host===p.id) this.host=[...this.players.values()].find(q=>q.socket && q.id!==p.id)?.id ?? p.id;
    this.broadcast({type:'notice',message:`${p.nickname} disconnected. Their spot is held for 25 seconds.`});
  }
  remove(p: Player) { this.physics.impacts.delete(p.body.handle);this.physics.world.removeRigidBody(p.body); this.players.delete(p.id); if(this.host===p.id) this.host=[...this.players.values()].find(q=>q.socket)?.id ?? [...this.players.keys()][0] ?? ''; if(!this.players.size) this.emptySince=Date.now(); }
  resetPositions() {
    this.physics.impacts.clear();this.systems.touches=[];for(const p of this.players.values()){p.game.activePower=null;p.game.powerTime=0;p.game.abilityTime=0;p.game.abilityPhase='IDLE';p.game.shotBonus=p.game.ramBonus=false;}
    const counts = [0,0];
    for(const p of this.players.values()) { const index=counts[p.team]++; this.physics.reset(p.body,{x:index===0?0:10,y:PLAYER.suspensionRest,z:(p.team===0?1:-1)*ARENA.length*.31}); const jumpId=p.input.jumpId??p.lastJumpId;Object.assign(p,newMotor(p.team===0?0:Math.PI));p.lastJumpId=jumpId;p.body.setRotation(p.rotation,true);p.input=idleInput(); }
    this.physics.reset(this.physics.rock,{x:0,y:ROCK.radius+.05,z:0});
  }
  start(requester: string, rematch = false) {
    if(requester!==this.host) throw new Error('Only the room host can start.');
    if(this.phase!==(rematch?'MATCH_END':'LOBBY')) throw new Error('Cannot start from this match state.');
    const active=[...this.players.values()].filter(p=>p.socket);
    if(!active.length || (!rematch && active.some(p=>!p.ready))) throw new Error('Every connected player must be ready.');
    this.systems.reset();this.score=[0,0]; this.remaining=this.duration; this.overtime=false; this.goalTeam=-1; this.resetPositions(); this.countdown=3; this.transition('COUNTDOWN'); console.log(`[match] ${this.code} started`);
  }
  lobby(requester: string) { if(requester!==this.host) throw new Error('Only the host can return everyone to the lobby.'); if(this.phase==='LOBBY') return; this.transition('LOBBY'); for(const p of this.players.values()) p.ready=false; this.resetPositions(); }
  goal(team: 0|1) { if(this.phase!=='PLAYING' && this.phase!=='OVERTIME') return; this.score[team]++;this.systems.goal(team); this.goalTeam=team; this.countdown=2.5; this.transition('GOAL_PAUSE'); console.log(`[goal] ${this.code} ${this.score.join(':')}`); }
  update(dt=1/RULES.tick, now=Date.now()) {
    this.tick++;
    for(const p of this.players.values()) if(p.disconnectedAt && now-p.disconnectedAt>RULES.reconnectMs) this.remove(p);
    if(this.phase==='LOBBY'||this.phase==='MATCH_END') return;
    if(this.phase==='COUNTDOWN'||this.phase==='GOAL_PAUSE') {
      this.systems.pause();this.countdown-=dt;
      if(this.countdown<=0) {
        if(this.phase==='GOAL_PAUSE') {
          if(this.overtime || (this.remaining<=0 && this.score[0]!==this.score[1])) { this.transition('MATCH_END'); console.log(`[match] ${this.code} finished`); }
          else { if(this.remaining<=0) this.overtime=true; this.resetPositions(); this.countdown=3; this.transition('COUNTDOWN'); }
        } else this.transition(this.overtime?'OVERTIME':'PLAYING');
      }
      return;
    }
    const tickStart=performance.now();
    for(const p of this.players.values()) {
      if(now-p.inputAt>350 || !p.socket) p.input=idleInput();
      this.physics.drive(p.body,p,p.input,dt);p.processedSeq=p.input.seq;
    }
    this.systems.before(dt);this.physics.beforeStep([...this.players.values()],dt);this.physics.limitRock(dt);this.physics.world.timestep=dt;this.physics.world.step();const hits=this.physics.afterStep([...this.players.values()]);this.systems.after(hits);for(const p of this.players.values())syncAttitude(p,p.body.rotation(),p.body.angvel());
    this.tickMs=performance.now()-tickStart;
    const r=this.physics.rock.translation(); const radius=RULES.rockRadius;
    if(Math.abs(r.x)+radius<RULES.goalWidth/2 && r.y+radius<RULES.goalHeight && Math.abs(r.z)-radius>RULES.length/2) this.goal(r.z<0?0:1);
    if(!this.overtime) { const was=this.remaining;this.remaining=Math.max(0,this.remaining-dt); if(was>60&&this.remaining<=60)this.systems.emit('FINAL_MINUTE');if(was>10&&this.remaining<=10)this.systems.emit('TEN_SECONDS'); if(this.remaining===0 && this.phase==='PLAYING') { if(this.score[0]===this.score[1]) { this.overtime=true; this.transition('OVERTIME'); } else { this.transition('MATCH_END'); console.log(`[match] ${this.code} finished`); } } }
    // Fail-safe for an unexpected numerical escape, never client-controlled.
    if(r.y < -10 || Math.abs(r.x)>ARENA.width || Math.abs(r.z)>ARENA.length) this.physics.reset(this.physics.rock,{x:0,y:3,z:0});
  }
  snapshot(): Snapshot {
    const players: PlayerState[]=[...this.players.values()].map(p=>({ ...newMotor(),lastJumpId:p.lastJumpId,game:structuredClone(p.game),ping:p.ping,rotation:{...p.body.rotation()},angularVelocity:{...p.body.angvel()},angularDelta:{...p.angularDelta},probeCount:p.probeCount,jumpTime:p.jumpTime,jumpState:p.jumpState,slide:p.slide,dodgeAxis:{...p.dodgeAxis},id:p.id,nickname:p.nickname,animal:p.animal,boostStyleId:p.boostStyleId,team:p.team,ready:p.ready,connected:!!p.socket,position:{...p.body.translation()},velocity:{...p.body.linvel()},yaw:p.yaw,pitch:p.pitch,roll:p.roll,yawRate:p.yawRate,pitchRate:p.pitchRate,rollRate:p.rollRate,boost:p.boost,boosting:p.boosting,grounded:p.grounded,groundNormal:{...p.groundNormal},dodging:p.dodging,dodgeX:p.dodgeX,dodgeZ:p.dodgeZ,dodgeAvailable:p.dodgeAvailable,jumpHeld:p.jumpHeld,jumpLock:p.jumpLock,coyote:p.coyote,airTime:p.airTime,seq:p.processedSeq }));
    return {pickups:this.systems.pickups.map(p=>({...p})),events:this.systems.events.map(e=>({...e})),scorerId:this.systems.scorerId,assistId:this.systems.assistId,mvpId:this.systems.mvpId, mapId:this.mapId,code:this.code,host:this.host,phase:this.phase,players,rock:{position:{...this.physics.rock.translation()},rotation:{...this.physics.rock.rotation()},velocity:{...this.physics.rock.linvel()},angularVelocity:{...this.physics.rock.angvel()}},score:[...this.score],remaining:this.remaining,countdown:Math.max(0,this.countdown),overtime:this.overtime,goalTeam:this.goalTeam,eventId:this.eventId,tick:this.tick,...(this.debugEnabled?{debug:{...this.physics.debug([...this.players.values()]),tickMs:this.tickMs}}:{}) };
  }
}
