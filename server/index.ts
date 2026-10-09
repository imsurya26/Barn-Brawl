import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { randomInt } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { initPhysics } from './physics';
import { Room, send, type Player } from './room';
import { RULES } from '../shared/config';
import { parseMessage } from '../shared/protocol';
await initPhysics();
const rooms=new Map<string,Room>();
const configuredDuration=Number(process.env.MATCH_SECONDS??RULES.duration);
if(!Number.isInteger(configuredDuration)||configuredDuration<10||configuredDuration>3600)throw new Error('MATCH_SECONDS must be an integer from 10 to 3600.');
const root=resolve('dist');
const mime: Record<string,string>={'.wav':'audio/wav','.json':'application/json','.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  if(req.url==='/health') { res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true,rooms:rooms.size})); return; }
  try { const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname); const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname)); if(!path.startsWith(root+sep)) throw new Error('path'); const data=await readFile(path); res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','X-Content-Type-Options':'nosniff'}); res.end(data); }
  catch { res.writeHead(404); res.end('Not found. Development client runs on port 5173.'); }
});
const wss=new WebSocketServer({noServer:true,maxPayload:4096});
const connections=new Map<string,number>();
server.on('upgrade',(req,socket,head)=>{
  const origin=req.headers.origin;
  const allowed=process.env.ALLOWED_ORIGINS?.split(',');
  const ip=req.socket.remoteAddress??'unknown';
  if(req.url!=='/ws'||(allowed && (!origin||!allowed.includes(origin)))||(connections.get(ip)??0)>=16||wss.clients.size>=400) { socket.destroy(); return; }
  wss.handleUpgrade(req,socket,head,ws=>{ connections.set(ip,(connections.get(ip)??0)+1); ws.once('close',()=>connections.set(ip,Math.max(0,(connections.get(ip)??1)-1))); wss.emit('connection',ws); });
});
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code() { let c:string; do { c=Array.from({length:5},()=>alphabet[randomInt(alphabet.length)]).join(''); } while(rooms.has(c)); return c; }
wss.on('connection',(socket:WebSocket)=>{
  console.log('[network] connected');
  let pingAt=0;let room:Room|undefined, player:Player|undefined, bucket=0, windowStart=Date.now(), lastCreate=0, alive=true;
  const heartbeat=setInterval(()=>{ if(!alive) { socket.terminate(); return; } alive=false;pingAt=Date.now(); socket.ping(); },10000);
  socket.on('pong',()=>{alive=true;if(player&&pingAt)player.ping=Date.now()-pingAt;});
  socket.on('error',()=>{});
  socket.on('message',raw=>{
    const now=Date.now(); if(now-windowStart>1000) { bucket=0; windowStart=now; } if(++bucket>90) { socket.close(1008,'Rate limit'); return; }
    const m=parseMessage(raw.toString()); if(!m) { send(socket,{type:'error',message:'Invalid request.'}); return; }
    try {
      if(m.type==='ping') { send(socket,{type:'pong'}); return; }
      if(m.type==='create'||m.type==='join') {
        if(player) throw new Error('Leave the current room first.');
        if(m.type==='create') { if(now-lastCreate<3000||rooms.size>=100) throw new Error('Please wait before creating another room.'); lastCreate=now; room=new Room(code(),configuredDuration,process.env.NODE_ENV!=='production'&&process.env.PHYSICS_DEBUG==='1'); rooms.set(room.code,room); console.log(`[room] ${room.code} created`); }
        else { room=rooms.get(m.code!); if(!room) throw new Error('Room not found. Check the five-character code.'); }
        player=room.add(m.nickname,m.animal,m.boostStyleId,socket); console.log(`[room] ${room.code} joined`);
        send(socket,{type:'welcome',id:player.id,token:player.token,code:room.code});
      } else if(m.type==='resume') {
        if(player) throw new Error('Already connected.');
        const candidate=rooms.get(m.code); const p=candidate && [...candidate.players.values()].find(p=>p.token===m.token);
        if(!candidate||!p||p.socket||!p.disconnectedAt||now-p.disconnectedAt>RULES.reconnectMs) throw new Error('Reconnect window expired. Please join again.');
        room=candidate; player=p; p.socket=socket; p.disconnectedAt=0; p.inputAt=now; p.input.seq=0; if(!room.players.get(room.host)?.socket) room.host=p.id;
        send(socket,{type:'welcome',id:p.id,token:p.token,code:room.code});
      } else {
        if(!room||!player||!room.players.has(player.id)) throw new Error('Join a room first.');
        if(m.type==='input') { if(m.input.seq>player.input.seq) { player.input=m.input; player.inputAt=now; } }
        if(m.type==='select') { if(room.phase!=='LOBBY') throw new Error('Change your loadout in the lobby.'); player.animal=m.animal; player.boostStyleId=m.boostStyleId; player.ready=false; }
        if(m.type==='map')room.selectMap(player.id,m.mapId);
        if(m.type==='ready') { if(room.phase!=='LOBBY') throw new Error('The match is already underway.'); player.ready=m.ready; }
        if(m.type==='start') room.start(player.id);
        if(m.type==='rematch') room.start(player.id,true);
        if(m.type==='lobby') room.lobby(player.id);
        if(m.type==='leave') { room.remove(player); room=undefined; player=undefined; return; }
      }
      if(room && m.type!=='input') room.broadcast({type:'state',state:room.snapshot()});
    } catch(e) { send(socket,{type:'error',message:(e as Error).message}); }
  });
  socket.on('close',()=>{clearInterval(heartbeat); if(room && player && player.socket===socket) room.disconnect(player); console.log('[network] disconnected');});
});
let previousTick=performance.now(),accumulator=0,lastBroadcast=0;
setInterval(()=>{
  const time=performance.now(),now=Date.now();
  // Fixed steps with catch-up avoid slowing match time when OS timers fire late.
  accumulator+=Math.min((time-previousTick)/1000,.25);previousTick=time;
  while(accumulator>=1/RULES.tick){for(const room of rooms.values())room.update(1/RULES.tick,now);accumulator-=1/RULES.tick;}
  if(time-lastBroadcast>=1000/RULES.snapshotRate){for(const room of rooms.values())room.broadcast({type:'state',state:room.snapshot()});lastBroadcast=time;}
  for(const [id,room] of rooms)if(room.emptySince && now-room.emptySince>RULES.expiryMs){room.physics.dispose();rooms.delete(id);}
},1000/60);
const port=Number(process.env.PORT??3001);
server.listen(port,process.env.HOST??'0.0.0.0',()=>console.log(`Barn Brawl server http://localhost:${port} | WebSocket /ws | ${RULES.tick} Hz physics, ${RULES.snapshotRate} Hz snapshots`));
function shutdown() { for(const ws of wss.clients) ws.close(1001,'Server restarting'); for(const room of rooms.values()) room.physics.dispose(); server.close(()=>process.exit(0)); setTimeout(()=>process.exit(0),1000).unref(); }
process.on('SIGTERM',shutdown); process.on('SIGINT',shutdown);
