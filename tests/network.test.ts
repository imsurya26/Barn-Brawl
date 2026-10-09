import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import { WebSocket } from 'ws';
import type { ServerMessage,Snapshot } from '../shared/protocol';
const url=process.env.TEST_SERVER_URL??'ws://127.0.0.1:3101/ws';
let server:ChildProcess|undefined;
before(async()=>{if(!process.env.TEST_SERVER_URL){server=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,PORT:'3101'},stdio:['ignore','pipe','pipe']});await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Test server startup timed out')),10000);server!.stdout!.on('data',data=>{if(String(data).includes('Barn Brawl server')){clearTimeout(timeout);resolve();}});server!.once('error',reject);});}});
after(()=>{server?.kill();});
async function client(){const socket=new WebSocket(url);const messages:ServerMessage[]=[];socket.on('message',raw=>messages.push(JSON.parse(raw.toString())));await new Promise<void>((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});return {socket,messages,send:(m:object)=>socket.send(JSON.stringify(m))};}
async function until<T>(fn:()=>T|undefined|false,ms=6000):Promise<T>{const start=Date.now();while(Date.now()-start<ms){const v=fn();if(v)return v;await new Promise(r=>setTimeout(r,20));}throw new Error('Timed out waiting for server');}
test('real sockets: room code, independent input, shared snapshots, validation, host transfer and reconnect',async()=>{
 const a=await client(),b=await client();let c:Awaited<ReturnType<typeof client>>|undefined;
 try {
  b.send({type:'join',nickname:'B',code:'ZZZZZ',animal:'cow',boostStyleId:'hay'});await until(()=>b.messages.find(m=>m.type==='error'&&m.message.includes('not found')));
  a.send({type:'create',nickname:'Alpha',animal:'goat',boostStyleId:'dust'});const wa=await until(()=>a.messages.find(m=>m.type==='welcome'));assert.equal(wa.type,'welcome');if(wa.type!=='welcome')throw Error();
  b.send({type:'join',nickname:'Beta',code:wa.code,animal:'chicken',boostStyleId:'spark'});await until(()=>b.messages.find(m=>m.type==='welcome'));
  const latest=(client:typeof a)=>[...client.messages].reverse().find(m=>m.type==='state') as {type:'state';state:Snapshot}|undefined;
  await until(()=>latest(a)?.state.players.length===2);assert.equal(latest(a)!.state.players[1].boostStyleId,'spark');
  b.send({type:'start'});await until(()=>b.messages.find(m=>m.type==='error'&&m.message.includes('host')));
  a.send({type:'ready',ready:true});b.send({type:'ready',ready:true});await until(()=>latest(a)?.state.players.every(p=>p.ready));a.send({type:'start'});await until(()=>latest(a)?.state.phase==='PLAYING');
  let seq=1;const input=setInterval(()=>a.send({type:'input',input:{throttle:1,steer:0,jump:false,boost:true,seq:seq++}}),33);await new Promise(r=>setTimeout(r,800));clearInterval(input);
  await until(()=>latest(b)!.state.players[0].position.z<19);assert.ok(latest(b)!.state.players[0].boost<100);assert.equal(latest(b)!.state.players[1].boost,100);
  const commonA=a.messages.filter(m=>m.type==='state').at(-2) as {type:'state';state:Snapshot};const commonB=await until(()=>b.messages.find(m=>m.type==='state'&&m.state.tick===commonA.state.tick)) as {type:'state';state:Snapshot};assert.deepEqual(commonA.state,commonB.state);
  a.send({type:'score',score:[99,0]});await until(()=>a.messages.find(m=>m.type==='error'&&m.message==='Invalid request.'));assert.deepEqual(latest(a)!.state.score,[0,0]);
  a.socket.close();await until(()=>latest(b)?.state.host!==wa.id);c=await client();c.send({type:'resume',token:wa.token,code:wa.code});const wc=await until(()=>c!.messages.find(m=>m.type==='welcome'));assert.equal(wc.type,'welcome');if(wc.type==='welcome')assert.equal(wc.id,wa.id);await until(()=>latest(b)?.state.players.every(p=>p.connected));
 }finally{a.socket.close();b.socket.close();c?.socket.close();}
});
