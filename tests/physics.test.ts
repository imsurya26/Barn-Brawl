import test from 'node:test';
import assert from 'node:assert/strict';
import { initPhysics } from '../server/physics';
import { Room } from '../server/room';
import { ANIMALS, BOOSTS, RULES } from '../shared/config';
import { parseMessage } from '../shared/protocol';
import type { WebSocket } from 'ws';
await initPhysics();
const socket={readyState:1,bufferedAmount:0,send:()=>{}} as unknown as WebSocket;
function setup() {const r=new Room('TEST2');const p=r.add('Farmer','goat','dust',socket);p.ready=true;r.start(p.id);for(let i=0;i<RULES.tick*3+1;i++)r.update();return {r,p};}
test('server validates nicknames, inputs and cosmetics, rejects forged authority',()=>{
  for(const data of [null,{}, {type:'score',score:900},{type:'input',input:{throttle:99,steer:0,jump:false,boost:true,seq:1}},{type:'create',nickname:'<script>',animal:'goat',boostStyleId:'dust'}, {type:'select',animal:'goat',boostStyleId:'superboost'}]) assert.equal(parseMessage(JSON.stringify(data)),null);
  assert.equal(parseMessage('{'),null); assert.ok(parseMessage(JSON.stringify({type:'create',nickname:'Farmhand 1',animal:'goat',boostStyleId:'dust'})));
});
test('physical gravity, running, jump, wall containment, rock collision and boost resource',()=>{
  const {r,p}=setup();try {
    r.physics.reset(p.body,{x:12,y:1.3,z:21});for(let i=0;i<RULES.tick;i++)r.update();assert.ok(p.grounded);
    const y=p.body.translation().y;p.input={throttle:1,pitch:0,steer:0,jump:true,boost:true,seq:1};p.inputAt=Date.now();r.update();assert.ok(p.body.translation().y>y);
    p.input.jump=false;for(let i=0;i<RULES.tick*5;i++) {p.inputAt=Date.now();r.update();}
    assert.ok(p.boost>=0&&p.boost<1);assert.ok(p.body.translation().z<21);assert.ok(Math.abs(p.body.translation().x)<25);
    p.input.boost=false;for(let i=0;i<30;i++){p.inputAt=Date.now();r.update();}assert.ok(p.boost>0);
    r.physics.reset(r.physics.rock,{x:0,y:RULES.rockRadius+.01,z:0});r.physics.reset(p.body,{x:0,y:.7,z:5});p.yaw=0;p.pitch=0;p.roll=0;p.input.throttle=1;
    for(let i=0;i<RULES.tick*1.5;i++){p.inputAt=Date.now();r.update();}assert.ok(r.physics.rock.translation().z<-1,'player imparts momentum to physical rock');
    r.physics.rock.setLinvel({x:80,y:0,z:0},true);for(let i=0;i<90;i++)r.update();assert.ok(Math.abs(r.physics.rock.translation().x)<RULES.width/2);
  }finally{r.physics.dispose();}
});
test('a complete goal awards exactly once, pauses, resets and counts down',()=>{
  const {r}=setup();try {r.physics.reset(r.physics.rock,{x:0,y:RULES.rockRadius+.05,z:-RULES.length/2-RULES.rockRadius-.1});r.update();assert.deepEqual(r.score,[1,0]);assert.equal(r.phase,'GOAL_PAUSE');for(let i=0;i<RULES.tick*2;i++)r.update();assert.deepEqual(r.score,[1,0]);for(let i=0;i<RULES.tick*.6;i++)r.update();assert.equal(r.phase,'COUNTDOWN');assert.equal(r.physics.rock.translation().z,0);for(let i=0;i<RULES.tick*3+1;i++)r.update();assert.equal(r.phase,'PLAYING');}finally{r.physics.dispose();}
});
test('partial entry and shots outside the goal do not score',()=>{
  const {r}=setup();try {for(const pos of [{x:0,y:1.85,z:-RULES.length/2-.5},{x:13,y:1.85,z:-58},{x:0,y:12,z:-58}]){r.physics.reset(r.physics.rock,pos);r.update();assert.deepEqual(r.score,[0,0]);}}finally{r.physics.dispose();}
});
test('timer, sudden death, match end, rematch and lobby lifecycle',()=>{
  const {r,p}=setup();try {r.remaining=.001;r.update();assert.equal(r.phase,'OVERTIME');r.goal(1);for(let i=0;i<RULES.tick*3;i++)r.update();assert.equal(r.phase,'MATCH_END');assert.deepEqual(r.score,[0,1]);r.start(p.id,true);assert.equal(r.phase,'COUNTDOWN');assert.deepEqual(r.score,[0,0]);assert.equal(r.remaining,300);assert.equal(r.players.size,1);r.lobby(p.id);assert.equal(r.phase,'LOBBY');assert.equal(p.ready,false);p.ready=true;r.start(p.id);for(let i=0;i<RULES.tick*3+1;i++)r.update();r.score=[2,1];r.remaining=.001;r.update();assert.equal(r.phase,'MATCH_END');}finally{r.physics.dispose();}
});
test('all four animals and all five boost styles have identical movement',()=>{
  const results:number[]=[];
  for(const animal of ANIMALS)for(const boost of BOOSTS){const {r,p}=setup();try {p.animal=animal;p.boostStyleId=boost.id;p.input.throttle=1;p.input.boost=true;for(let i=0;i<20;i++){p.inputAt=Date.now();r.update();}results.push(p.body.translation().z);assert.ok(Math.abs(p.boost-(100-RULES.boostDrain*20/RULES.tick))<.01);}finally{r.physics.dispose();}}
  assert.ok(results.every(v=>Math.abs(v-results[0])<.0001));
});
test('balanced teams, capacity, host migration, reconnect grace and expiry',()=>{
  const r=new Room('TEST3');try {const players=ANIMALS.map((a,i)=>r.add(`P${i}`,a,'dust',socket));assert.deepEqual(players.map(p=>p.team),[0,1,0,1]);assert.throws(()=>r.add('Extra','goat','dust',socket),/full/);r.disconnect(players[0],1000);assert.equal(r.host,players[1].id);r.update(1/30,1000+RULES.reconnectMs-1);assert.equal(r.players.size,4);r.update(1/30,1000+RULES.reconnectMs+1);assert.equal(r.players.size,3);assert.throws(()=>r.start(players[2].id),/host/);assert.throws(()=>r.start(players[1].id),/ready/);}finally{r.physics.dispose();}
});
