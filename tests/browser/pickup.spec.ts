import {test, expect, type Page} from '@playwright/test';

const debug = (page: Page) => page.evaluate(() => (window as any).barnDebug);

test('a driven pickup and power activation replicate to the other browser', async ({browser}) => {
  const host = await browser.newContext(), guest = await browser.newContext();
  const a = await host.newPage(), b = await guest.newPage();
  const errors: string[] = [];
  for (const page of [a, b]) {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  }
  try {
    for (const page of [a, b]) {
      await page.goto('/');
      await expect(page.locator('.server-status')).toContainText('ONLINE');
      await page.getByRole('button', {name: 'SETTINGS'}).click();
      await page.locator('#graphics').selectOption('low');
      await page.getByRole('button', {name: '← BACK', exact: true}).click();
    }
    await a.locator('#nickname').fill('Pickup Driver');
    await a.getByRole('button', {name: 'PLAY / CREATE ROOM'}).click();
    await expect(a.locator('.room-code')).toBeVisible();
    const code = (await debug(a)).state.code;
    await b.locator('#nickname').fill('Pickup Witness');
    await b.getByRole('button', {name: 'JOIN ROOM'}).click();
    await b.locator('#room-code').fill(code);
    await b.getByRole('button', {name: 'JOIN THE HERD'}).click();
    await expect(b.locator('.room-code')).toBeVisible();
    await a.locator('[data-action=ready]').click();
    await b.locator('[data-action=ready]').click();
    await a.locator('[data-action=start]').click();
    await expect.poll(async () => (await debug(a)).state.phase).toBe('PLAYING');

    // Read authoritative positions, but drive only through real keyboard events.
    const first = await debug(a);
    const id = first.id;
    const target = first.state.pickups.find((p: any) => p.kind === 'power' && p.x === 27 && p.z === 22);
    expect(target).toBeTruthy();
    const deadline = Date.now() + 60000;
    let collected = false;
    while (Date.now() < deadline) {
      const me = (await debug(a)).state.players.find((p: any) => p.id === id);
      if (me.game.item) { collected = true; break; }
      const dx = target.x - me.position.x, dz = target.z - me.position.z;
      const desired = Math.atan2(-dx, -dz);
      const delta = Math.atan2(Math.sin(desired - me.yaw), Math.cos(desired - me.yaw));
      const speed = Math.hypot(me.velocity.x, me.velocity.z);
      const desiredSpeed = Math.abs(delta) > .6 ? 4 : Math.min(8, Math.max(2, Math.hypot(dx, dz) * 1.4));
      for (const [key, down] of [['KeyW', speed < desiredSpeed], ['KeyS', speed > desiredSpeed + 1], ['KeyA', delta > .08], ['KeyD', delta < -.08]] as const) {
        if (down) await a.keyboard.down(key); else await a.keyboard.up(key);
      }
      await a.waitForTimeout(100);
    }
    for (const key of ['KeyW', 'KeyS', 'KeyA', 'KeyD']) await a.keyboard.up(key);
    expect(collected, 'keyboard-driven animal reaches and collects the pickup').toBe(true);
    await expect(a.locator('#power-item')).toHaveText('Power Shot');
    await expect.poll(async () => (await debug(b)).state.players.find((p: any) => p.id === id).game.item).toBe('power-shot');
    await a.keyboard.press('KeyE');
    await expect.poll(async () => (await debug(b)).state.players.find((p: any) => p.id === id).game.stats.powerups).toBe(1);
    await expect(b.locator('#event-feed')).toContainText('Power Shot');
    await a.screenshot({path: 'test-results/powerup.png'});
    expect(errors).toEqual([]);
  } finally {
    await host.close();
    await guest.close();
  }
});
