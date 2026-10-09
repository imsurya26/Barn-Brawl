import {test,expect,type Page} from '@playwright/test';
const state=(p:Page)=>p.evaluate(()=> (window as any).barnDebug);
const browserBaseURL=`http://127.0.0.1:${process.env.BROWSER_TEST_PORT??'3102'}`;
test('two browsers play the same physical match',async({browser})=>{
  const ca=await browser.newContext({baseURL:browserBaseURL}),cb=await browser.newContext({baseURL:browserBaseURL});const a=await ca.newPage(),b=await cb.newPage();const errors:string[]=[];
  for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
  await a.goto('/');await expect(a.locator('.server-status')).toContainText('ONLINE');await a.screenshot({path:'test-results/menu.png'});
  await a.locator('#nickname').fill('Goat Captain');await a.getByRole('button',{name:'PLAY / CREATE ROOM'}).click();await expect(a.locator('.room-code')).toBeVisible();const code=(await state(a)).state.code;
  await b.goto('/');await expect(b.locator('.server-status')).toContainText('ONLINE');await b.locator('#nickname').fill('Chicken Wing');await b.getByRole('button',{name:'JOIN ROOM'}).click();await b.locator('#room-code').fill(code);await b.getByRole('button',{name:'JOIN THE HERD'}).click();await b.locator('[data-action=animal][data-value=chicken]').click();await b.locator('[data-action=next-boost]').click();await b.locator('[data-action=next-boost]').click();
  await expect(a.locator('.teams')).toContainText('Chicken Wing');await expect(a.locator('.teams')).toContainText('Spark Trail');await a.screenshot({path:'test-results/lobby.png'});
  await a.locator('#map-select').selectOption('harvest');await expect.poll(async()=>(await state(b)).state.mapId).toBe('harvest');await expect.poll(async()=>(await state(b)).loadingMap).toBe(false);await expect(b.locator('#map-select')).toBeDisabled();
  await a.locator('[data-action=ready]').click();await b.locator('[data-action=ready]').click();await expect(a.locator('[data-action=start]')).toBeEnabled();await a.locator('[data-action=start]').click();await expect.poll(async()=>(await state(a)).state.phase).toBe('PLAYING');
  // Move the second animal clear of the goal, then drive the first through the center rock.
  await b.keyboard.down('KeyW');await b.keyboard.down('KeyD');await b.waitForTimeout(850);await b.keyboard.up('KeyD');await b.waitForTimeout(700);await b.keyboard.up('KeyW');
  const start=(await state(a)).state.players[0].position.z;
  await a.keyboard.press('KeyQ');await expect.poll(async()=>(await state(a)).cameraMode).toBe('ROCK');await a.keyboard.press('KeyQ');
  await a.keyboard.down('KeyW');await a.keyboard.down('ShiftLeft');await a.waitForTimeout(700);
  await expect.poll(async()=>(await state(b)).state.players[0].position.z).toBeLessThan(start-1);
  await expect.poll(async()=>(await state(b)).state.players[0].boost).toBeLessThan(95);
  await a.screenshot({path:'test-results/gameplay.png'});
  await expect.poll(async()=>(await state(a)).state.score.reduce((x:number,y:number)=>x+y,0),{timeout:20000}).toBe(1);const scored=(await state(a)).state.score;
  await a.keyboard.up('KeyW');await a.keyboard.up('ShiftLeft');await expect.poll(async()=>(await state(b)).state.score).toEqual(scored);await a.screenshot({path:'test-results/goal.png'});
  await expect.poll(async()=>(await state(a)).state.phase,{timeout:10000}).toBe('PLAYING');
  await a.keyboard.down('Space');await a.waitForTimeout(370);await a.keyboard.up('Space');await expect.poll(async()=>(await state(a)).state.players[0].position.y).toBeGreaterThan(1.8);
  await a.keyboard.down('KeyA');await a.keyboard.down('KeyC');await a.waitForTimeout(60);await a.keyboard.down('Space');await a.waitForTimeout(90);await a.keyboard.up('Space');await a.keyboard.up('KeyA');await a.keyboard.up('KeyC');
  await expect.poll(async()=>(await state(b)).state.players[0].dodgeAvailable).toBe(false);
  await expect.poll(async()=>(await state(a)).state.players[0].grounded,{timeout:4000}).toBe(true);
  await expect.poll(async()=>(await state(a)).state.phase,{timeout:45000}).toBe('MATCH_END');await expect(b.locator('.final-score')).toHaveText(scored.join(' — '));await a.screenshot({path:'test-results/match-end.png'});
  await a.locator('[data-action=rematch]').click();await expect.poll(async()=>(await state(b)).state.phase).toBe('COUNTDOWN');expect((await state(a)).state.code).toBe(code);expect((await state(b)).state.players).toHaveLength(2);await expect.poll(async()=>(await state(a)).state.score).toEqual([0,0]);
  // Leave the rematch tied until the server enters sudden-death overtime.
  await expect.poll(async()=>(await state(b)).state.phase,{timeout:45000}).toBe('OVERTIME');await expect(b.locator('#clock')).toHaveText('OVERTIME');
  expect(errors).toEqual([]);await ca.close();await cb.close();
});
