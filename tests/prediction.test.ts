import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalPrediction} from '../client/network/prediction';
import {newMotor} from '../shared/controller';
import {idleInput,type PlayerState,type Snapshot} from '../shared/protocol';
const player=():PlayerState=>({...newMotor(),id:'self',nickname:'Test',animal:'goat',boostStyleId:'dust',team:0,ready:true,connected:true,position:{x:0,y:.66,z:35},velocity:{x:0,y:0,z:0},grounded:true,seq:0});
const snapshot=(p:PlayerState):Snapshot=>({mapId:'barnyard',code:'TEST2',host:p.id,phase:'PLAYING',players:[p],rock:{angularVelocity:{x:0,y:0,z:0},position:{x:0,y:1.8,z:0},velocity:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0,w:1}},score:[0,0],remaining:300,countdown:0,overtime:false,goalTeam:-1,eventId:1,tick:1});
test('local prediction responds before the next snapshot, never mutates authority and stops extrapolating',()=>{
 const p=player(),s=snapshot(p),before=JSON.stringify(s),prediction=new LocalPrediction();prediction.receive(p,s);const input={...idleInput(),throttle:1};const first=prediction.advance(1/60,input)!;assert.ok(first.position.z<35);assert.equal(JSON.stringify(s),before);
 for(let i=0;i<20;i++)prediction.advance(1/60,input);const z=prediction.state!.position.z;for(let i=0;i<60;i++)prediction.advance(1/60,input);assert.equal(prediction.state!.position.z,z);
});
test('prediction reconciles modest errors and clears history at a reset or collision',()=>{
 const p=player(),prediction=new LocalPrediction();prediction.receive(p,snapshot(p));prediction.advance(.05,{...idleInput(),throttle:1});const old=prediction.state!.position.z;
 prediction.receive({...p,position:{...p.position,z:old+.2}},snapshot(p));assert.ok(Math.abs(prediction.correction.z)>.1);prediction.advance(.02,idleInput());assert.ok(Math.abs(prediction.correction.z)<.2);
 prediction.receive(p,snapshot(p),true);assert.deepEqual(prediction.correction,{x:0,y:0,z:0});
 const near={...p,position:{x:0,y:.66,z:3}};prediction.receive(near,snapshot(near));assert.equal(prediction.safe,false);const v=prediction.advance(.05,{...idleInput(),boost:true})!;assert.equal(v.position.z,3);
});
