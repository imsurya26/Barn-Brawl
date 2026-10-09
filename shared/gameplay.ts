import type {Animal} from './config';
export const POWERUPS=['power-shot','magnet','shield','speed-surge','shockwave'] as const;
export type Powerup=typeof POWERUPS[number];
export const POWERUP_INFO:Record<Powerup,{name:string;icon:string;duration:number;description:string}>={
 'power-shot':{name:'Power Shot',icon:'✹',duration:10,description:'Your next rock strike hits harder.'},
 magnet:{name:'Magnet Pulse',icon:'∩',duration:2,description:'Draw the nearby rock toward you briefly.'},
 shield:{name:'Shield',icon:'⬟',duration:3,description:'Soften incoming animal knockback.'},
 'speed-surge':{name:'Speed Surge',icon:'ϟ',duration:2,description:'Quicker acceleration. Same safe top speed.'},
 shockwave:{name:'Shockwave',icon:'◎',duration:.4,description:'A short-range pulse pushes rivals and the rock.'}
};
export const ABILITIES:Record<Animal,{name:string;icon:string;cooldown:number;duration:number;description:string}>={
 goat:{name:'Ram Rush',icon:'♈',cooldown:12,duration:.75,description:'Charge forward; empower one rock hit.'},
 pig:{name:'Belly Bounce',icon:'●',cooldown:14,duration:2,description:'Hop, then push nearby rivals on landing.'},
 cow:{name:'Ground Stomp',icon:'◆',cooldown:15,duration:.35,description:'Wind up a grounded pulse. Rivals can escape.'},
 chicken:{name:'Wing Burst',icon:'✦',cooldown:12,duration:1.25,description:'Brief lift and stronger aerial control.'}
};
export const GAMEPLAY={pickupRadius:1.25,pickupHeight:1.4,smallBoost:12,smallRespawn:4,largeRespawn:10,powerRespawn:20,powerShotBonus:6,ramBonus:3,ramAccel:8,ramKnockback:3,magnetRange:7,magnetAccel:7,shieldScale:.45,surgeAccel:5,shockRange:5,shockPlayer:4,shockRock:3,pigHop:3,pigRange:4,pigPlayer:3,pigRock:2,cowRange:4.5,cowPlayer:4,cowRock:3,chickenLift:3,chickenForward:2,assistWindow:5,touchWindow:12,shotMin:8,saveHorizon:3} as const;
export interface Stats {goals:number;assists:number;saves:number;shots:number;powerups:number;abilities:number}
export interface GameplayState {item:Powerup|null;activePower:Powerup|null;powerTime:number;abilityTime:number;abilityCooldown:number;abilityPhase:'IDLE'|'ACTIVE'|'WINDUP'|'AIRBORNE';shotBonus:boolean;ramBonus:boolean;useHeld:boolean;abilityHeld:boolean;stats:Stats}
export const newGameplay=():GameplayState=>({item:null,activePower:null,powerTime:0,abilityTime:0,abilityCooldown:0,abilityPhase:'IDLE',shotBonus:false,ramBonus:false,useHeld:false,abilityHeld:false,stats:{goals:0,assists:0,saves:0,shots:0,powerups:0,abilities:0}});
export interface Pickup {id:string;kind:'small'|'large'|'power';x:number;z:number;remaining:number;power?:Powerup}
export function createPickups():Pickup[]{const result:Pickup[]=[];const add=(kind:Pickup['kind'],x:number,z:number,power?:Powerup)=>result.push({id:`${kind}-${result.length}`,kind,x,z,remaining:0,power});for(const z of [-38,-18,18,38])for(const x of [-18,0,18])add('small',x,z);for(const x of [-35,35])for(const z of [-40,40])add('large',x,z);for(const [x,z] of [[-27,-22],[27,22],[-27,22],[27,-22]])add('power',x,z,'power-shot');return result;}
export type EventKind='KICKOFF'|'GOAL_SCORED'|'ASSIST_AWARDED'|'SAVE_AWARDED'|'BIG_SAVE'|'LONG_SHOT'|'AERIAL_HIT'|'OVERTIME'|'FINAL_MINUTE'|'TEN_SECONDS'|'MATCH_VICTORY'|'COMEBACK'|'HAT_TRICK'|'POWERUP_SPAWN'|'POWERUP_COLLECTED'|'POWERUP_USED'|'ABILITY_USED'|'ABILITY_READY'|'STRONG_SHOT';
export interface MatchEvent {id:number;tick:number;kind:EventKind;playerId?:string;name?:string;team?:number;detail?:string;x?:number;y?:number;z?:number}
