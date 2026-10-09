import test,{after} from 'node:test';
import {Room} from '../server/room';
import type {WebSocket} from 'ws';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {ArenaPhysics,initPhysics} from '../server/physics';
import {PLAYER as P,ROCK as R,RULES,ARENA} from '../shared/config';
import {newMotor,length,heading,syncAttitude,dot,scale,plus} from '../shared/controller';
import {idleInput,type Input} from '../shared/protocol';
await initPhysics();const dt=1/RULES.tick;const results:Record<string,unknown>={physicsHz:RULES.tick};
function rig(){const physics=new ArenaPhysics(),motor=newMotor(),body=physics.createPlayer({x:0,y:P.suspensionRest,z:35}),input=idleInput();physics.reset(physics.rock,{x:30,y:R.radius,z:0});
 const tick=()=>{physics.drive(body,motor,input,dt);physics.beforeStep([{body}],dt);physics.limitRock(dt);physics.world.step();physics.afterStep([{body}]);syncAttitude(motor,body.rotation(),body.angvel());};
 const step=(seconds:number,update:Partial<Input>={})=>{Object.assign(input,update);for(let i=0;i<Math.round(seconds*RULES.tick);i++)tick();};step(.5);return {physics,motor,body,input,tick,step,dispose:()=>physics.dispose()};}

test('120 Hz suspension chassis: throttle, boost duration, coast and braking benchmarks',()=>{const r=rig();try{
 const samples:number[]=[];for(let i=0;i<12;i++){r.step(.25,{throttle:1});samples.push(length(r.body.linvel()));}results.acceleration=samples;results.normalSpeed=samples.at(-1);assert.ok(samples[0]>2&&samples[0]<5);assert.ok(samples.at(-1)!>13.8&&samples.at(-1)!<14.3);
 r.step(.95,{boost:true});results.boostSpeed=length(r.body.linvel());assert.ok(length(r.body.linvel())>22.7&&length(r.body.linvel())<23.2);
 r.physics.reset(r.body,{x:0,y:P.suspensionRest,z:40});Object.assign(r.motor,newMotor());r.motor.boost=100;let duration=0;while(r.motor.boost>0&&duration<4){r.tick();duration+=dt;}results.boostDuration=duration;assert.ok(Math.abs(duration-3)<.03);
 r.physics.reset(r.body,{x:0,y:P.suspensionRest,z:30});Object.assign(r.motor,newMotor());r.step(.2,{throttle:0,boost:false});r.body.setLinvel({x:0,y:0,z:-14},true);const start=r.body.translation().z;let t=0;while(-r.body.linvel().z>.1&&t<2){r.step(dt,{throttle:-1});t+=dt;}results.braking={seconds:t,distance:start-r.body.translation().z};assert.ok(t<.48&&t>.32);
 r.body.setLinvel({x:0,y:0,z:-10},true);r.step(.5,{throttle:0});results.coastSpeed=-r.body.linvel().z;assert.ok(-r.body.linvel().z>7&&-r.body.linvel().z<7.6);
 assert.ok(r.motor.probeCount===4);assert.ok(Math.abs(r.motor.pitch)<.1&&Math.abs(r.motor.roll)<.1);
 }finally{r.dispose();}});

test('measured steering radii and powerslide preserve controlled sideways momentum',()=>{
 const radii:Record<string,number>={};for(const speed of [5,10,15,20,23]){const r=rig();try{
 for(let i=0;i<180;i++){const f=heading(r.motor.yaw),v=r.body.linvel(),along=dot(v,f);r.body.applyImpulse(scale(f,(speed-along)*r.body.mass()),true);r.input.steer=1;r.input.throttle=1;r.tick();}
 radii[speed]=Math.hypot(r.body.linvel().x,r.body.linvel().z)/Math.abs(r.body.angvel().y);const targets:Record<number,number>={5:2.5,10:4.3,15:7.3,20:10,23:11.4};assert.ok(Math.abs(radii[speed]/targets[speed]-1)<.15,`${speed}: ${radii[speed]}`);
 }finally{r.dispose();}}results.turningRadii=radii;
 const r=rig();try{r.step(.8,{throttle:1});r.step(.3,{steer:1,powerslide:true});assert.ok(r.motor.slide>.8);const v=r.body.linvel(),f=heading(r.motor.yaw);assert.ok(Math.abs(v.x*f.z-v.z*f.x)>.5);assert.ok(Number.isFinite(r.motor.yaw));}finally{r.dispose();}
});
function jump(hold:number,second=false){const r=rig();try{const base=r.body.translation().y;let max=base,peak=0,land=0;for(let i=0;i<360;i++){const t=i*dt;r.input.jump=t<hold||(second&&t>=.3&&t<.34);r.tick();if(r.body.translation().y>max){max=r.body.translation().y;peak=t;}if(t>.3&&r.motor.grounded){land=t;break;}}return{height:max-base,peak,land};}finally{r.dispose();}}
test('tap, held and double jumps have distinct height and stable recovery',()=>{const tap=jump(dt),held=jump(.2),double=jump(.2,true);results.jumps={tap,held,double};assert.ok(tap.height>.55&&tap.height<.85);assert.ok(held.height>1.6&&held.height>tap.height*2);assert.ok(double.height>held.height+.7);assert.ok(tap.land>0&&held.land>0&&double.land>0);});
test('directional torque flips, flip cancel, aerial control and boost',()=>{
 for(const [throttle,steer] of [[1,0],[-1,0],[0,1],[0,-1],[1,1]]){const r=rig();try{r.step(.05,{jump:true});r.step(.07,{jump:false});const v={...r.body.linvel()};r.step(dt,{jump:true,throttle,steer});assert.equal(r.motor.jumpState,'DODGE');assert.equal(r.motor.dodgeAvailable,false);assert.ok(Math.hypot(r.body.linvel().x-v.x,r.body.linvel().z-v.z)>4.7);r.step(.25,{jump:false,throttle:0,steer:0});assert.ok(length(r.body.angvel())>4);r.step(2,{throttle:0,steer:0});assert.ok(r.motor.grounded);}finally{r.dispose();}}
 const r=rig();try{r.physics.reset(r.body,{x:0,y:10,z:0});r.step(.2,{pitch:1,yaw:1,roll:1});assert.ok(length(r.body.angvel())>1);r.step(.2,{boost:true});assert.ok(length(r.body.linvel())>1);assert.ok(length(r.body.angvel())<=P.maxAngularSpeed+.1);}finally{r.dispose();}
});
function shot(speed:number,offset=0){const r=rig();try{r.physics.reset(r.body,{x:offset,y:P.suspensionRest,z:4});r.physics.reset(r.physics.rock,{x:0,y:R.radius,z:0});r.body.setLinvel({x:0,y:0,z:-speed},true);let peak=0;for(let i=0;i<120;i++){r.physics.beforeStep([{body:r.body}],dt);r.physics.limitRock(dt);r.physics.world.step();r.physics.afterStep([{body:r.body}]);peak=Math.max(peak,length(r.physics.rock.linvel()));}return {speed:peak,velocity:{...r.physics.rock.linvel()}};}finally{r.dispose();}}
test('sphere rock responds monotonically to real impacts and redirects glancing shots',()=>{const shots=[5,10,15,23].map(s=>shot(s));results.shots=shots;for(let i=0;i<shots.length;i++){assert.ok(shots[i].speed>3);if(i)assert.ok(shots[i].speed>shots[i-1].speed+2);}const angle=shot(15,.5);assert.ok(Math.abs(angle.velocity.x)>1);});
test('rock rebound, angular cap, 60 m/s CCD and finite developer data',()=>{const r=rig();try{
 r.physics.reset(r.physics.rock,{x:0,y:8,z:0});let impacted=false,peak=0;for(let i=0;i<480;i++){r.physics.limitRock(dt);r.physics.world.step();const p=r.physics.rock.translation(),v=r.physics.rock.linvel();if(p.y<R.radius+.15&&v.y>0)impacted=true;if(impacted)peak=Math.max(peak,p.y);}results.reboundHeight=peak;assert.ok(peak>3&&peak<4);
 for(const target of ['wall','goal','animal']){r.physics.reset(r.body,{x:0,y:P.suspensionRest,z:0});r.physics.reset(r.physics.rock,target==='wall'?{x:35,y:2,z:0}:{x:0,y:target==='animal'?R.radius:2,z:target==='goal'?45:-8});r.physics.rock.setLinvel(target==='wall'?{x:60,y:0,z:0}:{x:0,y:0,z:60},true);for(let i=0;i<40;i++){r.physics.limitRock(dt);r.physics.world.step();}assert.ok(Math.abs(r.physics.rock.translation().x)<ARENA.width/2);assert.ok(Math.abs(r.physics.rock.translation().z)<ARENA.length/2+ARENA.goalDepth);if(target==='animal')assert.ok(length(r.body.linvel())>1);}
 r.physics.rock.setAngvel({x:20,y:0,z:0},true);r.physics.limitRock(dt);assert.ok(length(r.physics.rock.angvel())<6.01);const debug=r.physics.debug([{body:r.body,yaw:0}]);assert.equal(debug.rays.length,24);assert.ok([...debug.vertices,...debug.rays,...debug.velocities].every(Number.isFinite));
 }finally{r.dispose();}});
test('fixed 120 Hz results are identical at 30, 60 and 144 presentation Hz',()=>{const positions=[];for(const fps of [30,60,144]){const r=rig();let accumulator=0,ticks=0;for(let frame=0;frame<fps;frame++){accumulator+=1/fps;while(accumulator+1e-10>=dt){r.step(dt,{throttle:1,steer:.3});accumulator-=dt;ticks++;}}positions.push({...r.body.translation(),ticks});r.dispose();}assert.deepEqual(positions[0],positions[1]);assert.deepEqual(positions[1],positions[2]);results.frameRates=positions;mkdirSync('test-results',{recursive:true});writeFileSync('test-results/physics-benchmark.json',JSON.stringify(results,null,2));console.log('BENCHMARK',JSON.stringify(results));});


test('curved transition supports wall ascent, aerial rock contact and repeat-contact safety',()=>{
 const r=rig();try{
  r.physics.reset(r.body,{x:35,y:P.suspensionRest,z:0});Object.assign(r.motor,newMotor(-Math.PI/2));r.body.setRotation(r.motor.rotation,true);r.body.setLinvel({x:17,y:0,z:0},true);let peak=0;
  for(let i=0;i<240;i++){r.input.throttle=1;r.tick();peak=Math.max(peak,r.body.translation().y);assert.ok(Number.isFinite(r.body.translation().x));}assert.ok(peak>2,`ramp ascent ${peak}`);assert.ok(Math.abs(r.body.translation().x)<ARENA.width/2+1);
  r.physics.reset(r.body,{x:0,y:5,z:4});r.physics.reset(r.physics.rock,{x:0,y:5,z:0});r.body.setLinvel({x:0,y:0,z:-15},true);let speed=0;for(let i=0;i<50;i++){r.physics.beforeStep([{body:r.body}],dt);r.physics.world.step();r.physics.afterStep([{body:r.body}]);speed=Math.max(speed,length(r.physics.rock.linvel()));}assert.ok(speed>15);
  r.physics.reset(r.body,{x:0,y:P.suspensionRest,z:1.9});r.physics.reset(r.physics.rock,{x:0,y:R.radius,z:0});r.physics.impacts.clear();for(let i=0;i<240;i++){r.physics.beforeStep([{body:r.body}],dt);r.physics.world.step();r.physics.afterStep([{body:r.body}]);}assert.ok(length(r.physics.rock.linvel())<2,'resting contact must not add repeated launch impulses');
 }finally{r.dispose();}
});


test('four-player 120 Hz simulation timing benchmark',()=>{
 const room=new Room('PERF2'),socket={readyState:1,bufferedAmount:0,send:()=>{}} as unknown as WebSocket;
 try{for(let i=0;i<4;i++)room.add(`P${i}`,'goat','dust',socket);room.phase='PLAYING';const times:number[]=[];
 for(let tick=0;tick<600;tick++){let i=0;for(const p of room.players.values()){p.input={...idleInput(),throttle:1,steer:Math.sin(tick*.01+i++),boost:tick<360,seq:tick};p.inputAt=Date.now();}room.update();times.push(room.tickMs);}
 times.sort((a,b)=>a-b);results.tickTimeMs={mean:times.reduce((a,b)=>a+b,0)/times.length,p95:times[Math.floor(times.length*.95)],max:times.at(-1),budget:1000/RULES.tick};assert.ok(times.every(Number.isFinite));
 }finally{room.physics.dispose();}
});
after(()=>{mkdirSync('test-results',{recursive:true});writeFileSync('test-results/physics-benchmark.json',JSON.stringify(results,null,2));});
