import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const debug=(p:any)=>p.evaluate(()=>(window as any).barnDebug);
test('four maps load consistently and graphics presets change presentation only',async({browser})=>{
 const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();const errors:string[]=[];for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
 await a.goto('/');await a.locator('#nickname').fill('Map Host');await a.getByRole('button',{name:'PLAY / CREATE ROOM'}).click();await expect(a.locator('.room-code')).toBeVisible();const code=(await debug(a)).state.code;
 await b.goto('/');await b.locator('#nickname').fill('Map Guest');await b.getByRole('button',{name:'JOIN ROOM'}).click();await b.locator('#room-code').fill(code);await b.getByRole('button',{name:'JOIN THE HERD'}).click();await expect(b.locator('#map-select')).toBeDisabled();
 const stats=[];for(const id of ['barnyard','harvest','frostbite','canyon']){
  await a.locator('#map-select').selectOption(id);await expect.poll(async()=>(await debug(b)).state.mapId).toBe(id);for(const p of [a,b])await expect.poll(async()=>!(await debug(p)).loadingMap,{timeout:15000}).toBe(true);
  const d=await debug(a);stats.push({map:id,drawCalls:d.drawCalls,triangles:d.triangles});await a.screenshot({path:`test-results/map-${id}.png`});
 }
 await a.getByRole('button',{name:'SETTINGS'}).click();for(const quality of ['low','high','medium']){await a.locator('#graphics').selectOption(quality);await expect.poll(async()=>(await debug(a)).quality).toBe(quality);await expect.poll(async()=>!(await debug(a)).loadingMap,{timeout:15000}).toBe(true);expect((await debug(a)).state.mapId).toBe('canyon');}
 expect(errors).toEqual([]);writeFileSync('test-results/render-stats.json',JSON.stringify(stats,null,2));await context.close();
});
for(const rtt of [30,60,100,150])test(`real WebSocket simulation at ${rtt} ms RTT`,async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:600}}),page=await context.newPage();const timers=new Set<ReturnType<typeof setTimeout>>();let closed=false;
 await page.routeWebSocket('**/ws',route=>{const server=route.connectToServer();const later=(fn:()=>void)=>{const timer=setTimeout(()=>{timers.delete(timer);if(!closed)fn();},rtt/2);timers.add(timer);};route.onMessage(m=>later(()=>server.send(m)));server.onMessage(m=>later(()=>route.send(m)));});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('/');await page.getByRole('button',{name:'SETTINGS'}).click();await page.locator('#graphics').selectOption('low');await page.getByRole('button',{name:'← BACK',exact:true}).click();
  await page.locator('#nickname').fill(`Latency ${rtt}`);await page.getByRole('button',{name:'PLAY / CREATE ROOM'}).click();await page.locator('[data-action=ready]').click();await page.locator('[data-action=start]').click();await expect.poll(async()=>(await debug(page)).state.phase).toBe('PLAYING');
  const start=(await debug(page)).state.players[0].position.z;await page.keyboard.down('KeyW');await page.waitForTimeout(500);const during=await debug(page);expect(during.predicted.position.z).toBeLessThan(start-.1);
  await page.waitForTimeout(800);await page.keyboard.up('KeyW');const end=await debug(page);expect(end.state.players[0].position.z).toBeLessThan(start-3);expect(Math.abs(end.predicted.position.z-end.state.players[0].position.z)).toBeLessThan(4);expect(end.state.score).toEqual([0,0]);
  await page.keyboard.press('KeyQ');await expect.poll(async()=>(await debug(page)).cameraMode).toBe('ROCK');expect(errors).toEqual([]);
  writeFileSync(`test-results/latency-${rtt}.json`,JSON.stringify({simulatedRtt:rtt,serverDisplacement:start-end.state.players[0].position.z,predictionOffset:Math.abs(end.predicted.position.z-end.state.players[0].position.z)},null,2));
 }finally{closed=true;for(const t of timers)clearTimeout(t);await context.close();}
});
