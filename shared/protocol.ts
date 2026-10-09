import type {GameplayState,Pickup,MatchEvent} from './gameplay';
import {MAPS,type MapId} from './maps';
import { ANIMALS, BOOSTS, type Animal } from './config';
import type {MotorState} from './controller';
export type Phase = 'LOBBY'|'COUNTDOWN'|'PLAYING'|'GOAL_PAUSE'|'OVERTIME'|'MATCH_END';
export type Vec = { x: number; y: number; z: number };
export type Input = { throttle: number; steer: number; jumpId?:number;usePower?:boolean;useAbility?:boolean;roll?:number; pitch?:number; yaw?:number; powerslide?:boolean; clientTick?:number; jump: boolean; boost: boolean; seq: number };
export const idleInput = (): Input => ({ throttle: 0, steer: 0, jump: false, boost: false, seq: 0 });
export interface PlayerState extends MotorState { game?:GameplayState;ping?:number;id: string; nickname: string; animal: Animal; boostStyleId: string; team: 0|1; ready: boolean; connected: boolean; position: Vec; velocity: Vec; seq: number }
export interface PhysicsDebug {vertices:number[];rays:number[];velocities:number[];contacts:Vec[];normals?:number[];tickMs?:number}
export interface Snapshot { pickups?:Pickup[];events?:MatchEvent[];mvpId?:string;scorerId?:string;assistId?:string;mapId:MapId; code: string; host: string; phase: Phase; players: PlayerState[]; rock: { position: Vec; rotation: { x: number; y: number; z: number; w: number }; velocity: Vec;angularVelocity:Vec }; score: [number,number]; remaining: number; countdown: number; overtime: boolean; goalTeam: number; eventId: number; tick: number; debug?:PhysicsDebug }
export type ClientMessage = {type:'map';mapId:MapId} | { type: 'create'|'join'; nickname: string; code?: string; animal: Animal; boostStyleId: string } | { type: 'resume'; token: string; code: string } | { type: 'input'; input: Input } | { type: 'select'; animal: Animal; boostStyleId: string } | { type: 'ready'; ready: boolean } | { type: 'start'|'rematch'|'lobby'|'leave'|'ping' };
export type ServerMessage = { type: 'welcome'; id: string; token: string; code: string } | { type: 'state'; state: Snapshot } | { type: 'error'|'notice'; message: string } | { type: 'pong' };
export function parseMessage(raw: string): ClientMessage | null {
  try {
    const m = JSON.parse(raw);
    if (!m || typeof m !== 'object') return null;
    if (['create','join'].includes(m.type)) {
      if (typeof m.nickname !== 'string' || !/^[\p{L}\p{N} _-]{1,18}$/u.test(m.nickname.trim()) || !ANIMALS.includes(m.animal) || !BOOSTS.some(b => b.id === m.boostStyleId)) return null;
      if (m.type === 'join' && (typeof m.code !== 'string' || !/^[A-Z2-9]{5}$/.test(m.code))) return null;
      return { type: m.type, nickname: m.nickname.trim(), code: m.code, animal: m.animal, boostStyleId: m.boostStyleId };
    }
    if (m.type === 'input' && m.input && ['usePower','useAbility'].every(k=>m.input[k]===undefined||typeof m.input[k]==='boolean') && (m.input.jumpId===undefined||(Number.isSafeInteger(m.input.jumpId)&&m.input.jumpId>=0)) && ['throttle','steer'].every(k => Number.isFinite(m.input[k]) && Math.abs(m.input[k]) <= 1) && ['roll','pitch','yaw'].every(k=>m.input[k]===undefined||(Number.isFinite(m.input[k])&&Math.abs(m.input[k])<=1)) && (m.input.powerslide===undefined||typeof m.input.powerslide==='boolean') && (m.input.clientTick===undefined||(Number.isSafeInteger(m.input.clientTick)&&m.input.clientTick>=0)) && typeof m.input.jump === 'boolean' && typeof m.input.boost === 'boolean' && Number.isSafeInteger(m.input.seq) && m.input.seq >= 0) return { type: 'input', input: { throttle: m.input.throttle, steer: m.input.steer, jumpId:m.input.jumpId,usePower:m.input.usePower??false,useAbility:m.input.useAbility??false,roll:m.input.roll??0,pitch:m.input.pitch,yaw:m.input.yaw,powerslide:m.input.powerslide??false,clientTick:m.input.clientTick??0, jump: m.input.jump, boost: m.input.boost, seq: m.input.seq } };
    if (m.type === 'select' && ANIMALS.includes(m.animal) && BOOSTS.some(b => b.id === m.boostStyleId)) return { type: 'select', animal: m.animal, boostStyleId: m.boostStyleId };
    if(m.type==='map'&&MAPS.some(map=>map.id===m.mapId))return {type:'map',mapId:m.mapId};
    if (m.type === 'ready' && typeof m.ready === 'boolean') return { type: 'ready', ready: m.ready };
    if (m.type === 'resume' && typeof m.token === 'string' && /^[a-f0-9]{48}$/.test(m.token) && typeof m.code === 'string' && /^[A-Z2-9]{5}$/.test(m.code)) return { type: 'resume', token: m.token, code: m.code };
    if (['start','rematch','lobby','leave','ping'].includes(m.type)) return { type: m.type };
    return null;
  } catch { return null; }
}
