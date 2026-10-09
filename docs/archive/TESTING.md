# Final continuation verification — 9 October 2026

Current results and limitations: [FINAL_REPORT.md](FINAL_REPORT.md).

- All 34 server/physics/gameplay/network tests passed with local socket access.
- All seven existing Chromium scenarios passed in one run (5.8 minutes).
- Added a real two-browser keyboard-driven pickup/activation regression. It exposed an internal powerup identifier in the event feed; after fixing the display label, it passed (40.3 seconds), with no page or console errors.
- Final production build and TypeScript checks passed: 597.56 kB JS / 160.99 kB gzip. The chunk-size advisory remains nonfatal.
- The final local build is served at http://localhost:3001 while its server process is running. Restart with `npm start` from this project folder; rebuild with `npm run build` after source edits.
- A five-minute practice round was observed from kickoff to 0:27 remaining with no console errors, then browser verification was interrupted. Its final transition is not claimed. Shortened two-browser regulation, victory, rematch and overtime passed.
- Fresh evidence is under `artifacts/continuation/`. Results below are historical and retain their original caveats.

## Earlier gameplay upgrade verification — 9 October 2026

- `npm run build`: production bundle and TypeScript checks pass. Vite reports a nonfatal bundle-size advisory (~597 kB JS, ~161 kB gzip).
- `npm test`: **34 passing tests**. Includes 11 new gameplay tests in `tests/gameplay.test.ts`.
- Final focused browser run: **3 passing scenarios** — the full two-browser match through goal, victory, rematch and overtime; camera persistence/mouse independence/jump edge/ability/audio checks; and all maps/graphics presets.
- The preceding latency browser run also passed the four real WebSocket RTT cases at **30, 60, 100 and 150 ms**. Across the focused and latency runs, all seven browser scenarios passed with no asserted page errors.

New tests verify the 1.15 m rock and animal heights; held-Space behavior across landing; distinct jump/dodge edges; no dodge from ordinary drive/boost/slide; one inventory slot; boost pad values and respawns; all five activations; ability cooldowns and grounded cow validation; physical Power Shot and magnet effects; shield resistance, shockwave falloff, pig landing and cow windup; real goal-line save attribution; assists/rematch reset; 29 valid offline PCM commentary files.

The opening full-boost browser shot now rebounds into the opposite goal with the larger sphere. An isolated Rapier reproduction confirms the changed trajectory (`artifacts/shot-trace.json`). The browser test verifies a real goal, agreement between both clients and the corresponding final score, instead of assuming which team must score. The bounce test now detects contact relative to the configured radius, rather than a hard-coded one-meter height.

The software-rendered graphics-rebuild check allows 15 seconds, matching the map-load check. The test server binds only to 127.0.0.1 to avoid a Windows wildcard-port conflict. It retains its own 30-second test matches; production remains five minutes. The final browser artifacts are preserved under `artifacts/gameplay-upgrade/final/`.

The last elevated production bundle completed successfully at 597 kB JavaScript / 161 kB gzip (Vite's chunk-size advisory is nonfatal). After that build, only a small settings event guard and test assertion were edited; `npx tsc --noEmit` passes on the current sources. A sandbox-only rebuild was blocked by Windows `EPERM` on Vite's `realpath`, and a sandbox-only socket test was blocked by `EACCES` binding port 3101. Those restrictions did not occur in the elevated browser runs.

## Previous physics revision evidence (historical)

# Verification report — 9 October 2026

## Automated results

- `npm test`: 23 tests covering physics benchmarks, real sockets, lifecycle rules, cosmetic fairness, map authority, skinned LODs and client prediction.
- `npm run benchmark`: 9 grouped physics benchmarks. Raw measurements: `artifacts/verification/physics-benchmark.json`.
- `npm run test:browser`: 6 browser scenarios passed: complete two-player lifecycle, four maps/quality presets, and simulated 30/60/100/150 ms RTT.
- `npm run build`: TypeScript and production bundle verification.

See [PHYSICS_REVISION.md](PHYSICS_REVISION.md) for exact measured speeds, turning radii, boost duration, jump timing, rock behavior, simulation rate, CPU timings and changed files.

## What the tests exercise

Physical Rapier chassis: gradual acceleration, speed caps, coast, brake/reverse, four-probe suspension, curvature-based steering, drift, tap/hold/double jump, directional torque flips, aerial rotation/boost, landing and wall ascent. Sphere rock: increasingly strong real impacts, glancing and aerial contacts, predictable drop/rebound, angular cap, 60 m/s CCD and no repeated launch impulse from sustained contact. Rendering schedules of 30/60/144 Hz produce identical fixed-step outcomes.

Rules and networking: validated inputs, no forged score authority, balanced teams, capacity, host migration, resume tokens and expiry. Goals award once; pause/reset/countdown, regulation win, overtime, rematch and lobby transitions remain intact. Host-only map selection is validated and locked outside the lobby. All four map IDs reuse the same collision world. All animals and boost styles produce identical base physics with abilities inactive.

Models and effects: named skeletons, three decreasing skinned LODs, finite animated transforms, bounded cosmetic particle pools. Models were visually reviewed together in `artifacts/verification/animal-rigs.png`.

Browser tests use actual keyboard input and WebSockets. Two independent clients create/join, select map/animal/boost, ready/start, move, boost, hit the rock, score, jump/dodge/land, finish and rematch; tied regulation enters overtime. Screenshots cover menu, lobby, gameplay, goal, match end and all four maps. Map and quality tests check for JavaScript page errors. Latency tests delay each WebSocket direction by half the requested RTT, exercising the real persistent server rather than fake local multiplayer.

The final map/preset and 150 ms RTT cases were rerun after the last visual fixes. Test scripts still write fresh output under `test-results/`; the delivery evidence below is preserved under `artifacts/verification/`.

## Evidence files

- `artifacts/verification/physics-benchmark.json`: deterministic measurements and four-player CPU sample.
- `artifacts/verification/render-stats.json`: per-map lobby draw calls and triangles.
- `artifacts/verification/latency-30.json`, `latency-60.json`, `latency-100.json`, `latency-150.json`: delayed-socket movement and prediction samples.
- `artifacts/verification/map-barnyard.png`, `map-harvest.png`, `map-frostbite.png`, `map-canyon.png`: map screenshots.
- `artifacts/verification/animal-rigs.png`: model review.

## Verification limits

A complete default five-minute browser round, four simultaneous human browsers, native Firefox/Edge, real WAN jitter/loss, audio listening quality and a hardware-specific 60 FPS floor are not verified. Lifecycle browser rounds use a separate 30-second test server. Physics CPU timing is one local benchmark under background load; timings vary with background load and are not a production capacity guarantee. Browser rendering here uses SwiftShader and is not a gaming-laptop GPU benchmark.

Local prediction uses shared motor logic and acknowledged-input replay, with interpolation near collisions. Full client Rapier rollback is not implemented. Debug data is tested, but every interactive overlay mode has not been manually audited. Procedural skinned assets are used instead of imported GLB assets. No public deployment, Docker execution, multi-instance routing or production load/security audit is claimed.

The local delivery preview uses port 3002. Standard development uses 5173 with a server on 3001.
