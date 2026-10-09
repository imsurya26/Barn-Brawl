> Historical physics-revision report. The subsequent gameplay upgrade changes rock radius to 1.15 m and adds temporary abilities/powerups. Current behavior and tests are documented in GAMEPLAY_UPGRADE.md and TESTING.md.

# Barn Brawl — major upgrade verification

9 October 2026. This modifies the existing game; rooms, loadouts, scoring and match lifecycle remain server authoritative.

## Measured physics, not target constants

Run `npm run benchmark`. The benchmark creates the actual Rapier stadium/chassis and drives it at a fixed 120 Hz. Raw results are in `artifacts/verification/physics-benchmark.json`.

| Measurement | Actual result |
|---|---:|
| Normal top speed | 14.100 m/s |
| Boost top speed | 23.000 m/s |
| 100 boost duration | 3.008 seconds |
| Stop from 14 m/s | 0.400 seconds / 2.742 m |
| Coast from 10 m/s for 0.5 s | 7.375 m/s |
| Turning radius at 5 / 10 / 15 / 20 / 23 m/s | 2.55 / 4.32 / 7.30 / 10.00 / 11.40 m |
| Tap jump | 0.71 m rise; apex 0.458 s; landing 0.892 s |
| Held jump | 2.34 m rise; apex 0.892 s; landing 1.725 s |
| Held + double jump | 4.74 m rise; apex 1.342 s; landing 2.542 s |
| Rock drop from 8 m center height | 3.43 m rebound center height |
| Shot peak speeds from 5 / 10 / 15 / 23 m/s approaches | 7.36 / 14.54 / 22.13 / 34.45 m/s |
| Fixed simulation rate | 120 Hz / 8.333 ms step |
| Four-player simulation CPU time, one measured run | Mean 0.22 ms; p95 0.30 ms; maximum 1.16 ms |

The same input sequence produces identical final positions at simulated 30, 60 and 144 Hz presentation schedules. CCD tests fire the spherical rock at 60 m/s toward walls, goals and chassis. Tests also cover wall ascent, aerial hits, glancing hits, one-shot contact shaping, powerslide, all dodge directions and landing recovery.

## Architecture and changed files

| Files | Change |
|---|---|
| `shared/config.ts` | Central 120 Hz calibration, chassis mass/dimensions, suspension, curves, jump, boost, rock and camera parameters |
| `shared/controller.ts` | Replaced Euler assignment controller with shared linear/angular impulse motor, speed-curvature yaw servo, bounded grip, drift, jump state machine and controlled flips |
| `server/physics.ts` | Unlocked rounded chassis; four local-down spring-damper probes; torque through inertia tensor; lower center of mass; sphere rock; CCD; contact-enter impact shaping |
| `shared/arena.ts` | 115 × 90 × 24 m standardized shell, segmented rounded corners and quarter-circle floor/wall transitions |
| `server/room.ts`, `server/index.ts`, `shared/protocol.ts` | Authoritative map selection; processed-input acknowledgement; quaternion and angular-velocity snapshots; 120 Hz server accumulator |
| `client/network/prediction.ts` | Shared fixed-step motor prediction, acknowledged-input replay and correction; bounded 200 ms history; collision proximity fallback |
| `client/input/controls.ts`, `client/camera/follow.ts` | Explicit aerial inputs, Ctrl powerslide, Q rock camera; speed response; camera holds heading during flips |
| `client/rendering/animals.ts` | Four original skinned animals, compact named bone rigs, three mesh LODs, physics-driven pose reactions without root motion |
| `shared/maps.ts`, `client/rendering/arena.ts`, `client/rendering/map-props.ts` | Four themed stadiums with identical collision rules; build only selected scenery and dispose old scenery |
| `client/rendering/rock.ts`, `game.ts`, `debug.ts` | Sculpted cracked rock surface, material/light changes, pooled effects, quality presets, F3 developer diagnostics |
| `client/ui/interface.ts`, `client/style.css`, `client/main.ts` | Host map selector, loading stages, quality settings and revised controls; existing menu flow retained |
| `tests/physics-revision.test.ts`, `maps-models.test.ts`, `prediction.test.ts`, browser tests | Quantitative physics, map authority, rigs/LODs, prediction and multiplayer/latency verification |

The chassis is 180 mass units and the rock is 30. All animals and boost styles share these rules. Suspension casts from four corners along local down, applies spring-damper impulses at the contact points and uses weighted surface normals. Steering and aerial inputs apply angular impulses; the physics body integrates the quaternion. Animation never moves the competitive root. Jump release/hold, neutral second jump, directional dodge, forward-flip cancellation and recovery are explicit motor states.

## Maps and graphics

- **Barnyard Bowl:** warm farm daylight, red barn, tractor, wheat, hay, windmill, hills and stands.
- **Harvest Moon Arena:** night lighting, harvest moon, autumn trees, lanterns, pumpkins, drifting leaves and warm goal lamps.
- **Frostbite Ranch:** snow-covered scenery, mountain peaks, pines, icicles, cable lift outside the field and light snowfall. Traction is unchanged.
- **Sunset Canyon Ranch:** red mesas, dry turf, cacti, ranch structures and water tower. Traction is unchanged.

Low/Medium/High change render scale, shadows, environment/crowd detail and particle density. Static scenery is batched; distant animal animation is throttled. Small netting and surface markings do not cast expensive, noisy shadows. The lobby views measured 70–75 draw calls and roughly 28k–33k rendered triangles; these are scene samples, not worst-case ceilings.

Animal LOD triangle counts (near / medium / far): goat 22,128 / 5,064 / 1,792; pig 17,784 / 4,008 / 1,396; cow 24,288 / 5,568 / 1,960; chicken 25,920 / 6,216 / 1,638. Assets are generated as original skinned meshes, not downloaded proprietary models. There are no external texture/model payloads or uncompressed GLB downloads. Lightweight vertex shading is used instead of SSAO.

## Controls and developer tools

W/S accelerate/brake/reverse on the ground and pitch in air. A/D steer or yaw. Z/C roll. Ctrl powerslides. Shift boosts. Tap Space for a low jump, hold for height, release then press again for a neutral double jump or directional flip. S cancels a forward flip. Q toggles Rock Cam; R resets the camera.

For the developer overlay, set `$env:PHYSICS_DEBUG='1'` in PowerShell, run `npm run dev`, then open `http://localhost:5173/?physics=1`. F3 toggles colliders, suspension probes, contact normals and velocity vectors. Numeric fields include probe count, jump state, angular velocity, boost, speed, FPS and server tick time. Production builds do not enable this overlay. The development-only `?models=1` view shows all four animal rigs together for inspection.

## Multiplayer evidence and limits

The browser suite uses real WebSockets and a persistent server. Two independent browser contexts create/join a room, synchronize host map selection and loadouts, move, boost, jump, flip, strike the rock, score, finish, rematch and enter overtime. All four maps and all quality presets are exercised. Additional real-WebSocket proxy tests inject 30, 60, 100 and 150 ms RTT; each passes movement/prediction/camera checks without page errors. Snapshot comparison offsets during movement were approximately 1.03, 1.13, 1.68 and 1.68 m respectively; these compare present prediction with delayed server snapshots, not positional error against simultaneous ground truth.

Prediction remains a bounded shared-motor approximation, not full Rapier contact rollback. Actual WAN jitter, packet loss, four simultaneous human browsers and a hardware-specific 60 FPS guarantee are not established by these checks. Headless Chromium uses software rendering here. Human playtesting remains the judge of subjective competitive feel. No proprietary parity is claimed.

## Public calibration references

The implementation is original. Calibration references were the user's requested measurements and public [RLBot physics values](https://wiki.rlbot.org/v5/botmaking/useful-game-values/) and [jumping measurements](https://wiki.rlbot.org/v5/botmaking/jumping-physics/). Force/torque integration follows [Rapier's documented rigid-body APIs](https://rapier.rs/docs/user_guides/javascript/rigid_body_forces_and_impulses/). No extracted maps, assets or proprietary source were used.
