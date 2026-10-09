# BARN BRAWL

**Animals. Rocks. Absolute chaos.**

The ball is now 3.2 m across. See [DEPLOYMENT.md](DEPLOYMENT.md) for the current size change and Vercel/Render hosting setup.

A playable original browser sports game for up to four humans, with a single-player practice mode. The persistent Node server owns the physics, room membership, score, clock and boost resources. There are no bots pretending to be network players, accounts or database.

The gameplay upgrade adds server-owned boost pads, five carried powerups, four animal abilities, match stats, camera presets, an animated crowd, original audio and a victory stage. See [GAMEPLAY_UPGRADE.md](GAMEPLAY_UPGRADE.md) for rules, changed files and verification.

## Run locally

Requires Node.js 22.12+ (tested with Node 24).

```sh
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/ws` to the server on port 3001.

Separate terminals:

```sh
npm run dev:server
npm run dev:client
```

Production build, served by the same persistent Node process:

```sh
npm run build
npm start
```

Open **http://localhost:3001**. `/health` reports server health. The delivery session also runs a built preview on **http://localhost:3002**; that process is temporary.

## Two-browser test

1. Browser A: enter a nickname, choose **Play / Create Room**, then copy the actual room code.
2. Browser B (another browser, private window, or device): enter a nickname, choose **Join Room**, and enter the code.
3. The host selects Barnyard Bowl, Harvest Moon Arena, Frostbite Ranch or Sunset Canyon Ranch. In each lobby, choose Goat, Pig, Cow or Chicken and a boost style. Both players should see the selections and ready state.
4. Both choose **I'm ready**. The host chooses **Start match**.
5. Drive independently. Haymakers attack the teal goal, Trailblazers the orange goal. Strike the rock with your animal. The server scores only when the entire rock crosses the goal mouth.
6. Check both scoreboards and timers. After a goal, everyone receives the same pause, reset and countdown.
7. Play to the five-minute finish; a tie enters sudden-death overtime. The host can rematch or return the room to the lobby. Any player can leave for the main menu.

On the same LAN use the host computer's LAN address and port 5173, with local firewall access configured by the owner. For internet play, deploy the persistent server with HTTPS/WSS; a localhost URL is not an internet deployment.

## Controls

| Input | Action |
|---|---|
| W / S | Accelerate / brake then reverse; pitch down / up in air |
| A / D | Steer; yaw in air |
| Space | Tap / held jump; release and press again for double jump |
| Space again + direction in air | One aerial dodge |
| Shift | Boost |
| Z / C | Roll in air |
| Left Ctrl | Powerslide / drift |
| Q | Toggle Rock Cam / Player Cam |
| R | Reset follow camera |
| Mouse / wheel | Orbit camera / zoom independently of steering |
| E | Activate the carried powerup |
| F | Activate your animal ability |

Boost capacity is 100, drain is 33.3 per second, and regeneration is 12 per second while Shift is released. All animals use the same base movement parameters and chassis, with distinct temporary F abilities. Boost styles remain cosmetic. Settings include camera presets and sliders, reduced motion, UI scale, and master/music/effects/commentary/crowd volume; only preferences are saved in localStorage. Nicknames, reconnect tokens and match state stay in memory.

## Project structure and stack

```text
client/
  main.ts                 startup and render/input loops
  rendering/              Three.js arena, animals, animation, camera and interpolation
  input/                  keyboard controls and focus safety
  network/                WebSocket connection and reconnect
  effects/                pooled data-driven cosmetic particles
  audio/                  original Web Audio synthesis
  ui/                     menu, lobby, HUD, settings and match results
  style.css               responsive farm-club visual system
server/
  index.ts                HTTP/static hosting, WebSocket validation, limits and cleanup
  room.ts                 authoritative room and match state machine
  physics.ts              Rapier rigid bodies, colliders and movement
shared/
  config.ts               shared rules, four animals and five boost definitions
  protocol.ts             typed packets and strict runtime validation
tests/
  physics.test.ts         deterministic gameplay and rule checks
  network.test.ts         independent real WebSocket clients
  browser/game.spec.ts    independent Chromium contexts, real keyboard input
deploy/Caddyfile           TLS reverse proxy configuration
Dockerfile / compose.yaml persistent deployment packaging
```

TypeScript, Vite, Three.js, Rapier 3D, Node.js and `ws`; plain HTML/CSS UI. Models, scene props and audio are generated in code, so there is no external model download or asset license dependency. Google Fonts are optional presentation resources with fallback fonts.

## Networking and rules

The server simulates at a fixed 120 Hz and broadcasts at 30 Hz. Clients send bounded controls at 30 Hz. Remote players and the rock use a 65 ms interpolation buffer. Local movement uses the shared acceleration model for at most 200 ms of prediction, with acknowledged-input replay and reconciliation on each snapshot. Prediction is disabled near the rock, other players and walls; collisions remain server authoritative. This is short-horizon motor prediction, not full physics rollback or latency-compensated collision replay. Score, timer, collision results, boost drain and physics positions cannot be set by clients. The host only has permission to request match transitions.

Transitions: lobby → countdown → playing → goal pause → countdown. A tied expired clock enters overtime; the next goal ends the match. The finish screen supports rematch in the same room with the same players, lobby, and main menu. Goal transitions prevent duplicate points.

Teams balance automatically; rooms hold four player slots. A dropped connection loses input immediately, keeps its slot for 25 seconds, and can resume from its in-memory secret token. Host privilege transfers to another connected player. Reloading the page loses the in-memory token and is not seamless reconnect. Empty rooms expire after five minutes. Restarting the server clears rooms.

Packets are size-capped and schema-validated. Connections have message-rate limits and heartbeat checks; there are connection and room caps. Slow readers do not receive unbounded queued snapshots. Public hosting should additionally apply reverse-proxy connection and creation limits appropriate to the expected audience. Multi-node room routing and DDoS mitigation are outside V1.

## Boost architecture

`shared/config.ts` centralizes the 120 Hz physics tuning and exports five `BoostStyle` data objects:

| ID | Name | Presentation |
|---|---|---|
| `dust` | Dust Dash (default) | Dirt puffs and rush |
| `hay` | Hay Burst | Golden straw fragments |
| `spark` | Spark Trail | Emissive cartoon sparks |
| `wind` | Wind Rush | Pale speed streaks |
| `poop` | Poop Chaos (optional) | Small brown cartoon particles |

Each defines particle/trail presets, start/loop/end counts, color, audio frequency and animation metadata. `BoostEffects` reuses a pool of 220 meshes. Snapshots synchronize only style ID, boost amount and active state; each client generates particles locally. Animal-specific procedural animation is independent of the chosen trail.

To add a style, add one configuration entry. Reuse an existing particle preset, or extend the geometry preset map in `client/effects/boost.ts` for a new shape. The UI, preference lookup, validator and network synchronization derive their choices from the shared list. Do not change physics to implement a cosmetic. The reserved animation modifier field is currently 1 for all styles.

## Environment variables

| Variable | Where | Default / purpose |
|---|---|---|
| `PORT` | Node runtime | `3001` |
| `ALLOWED_ORIGINS` | Node runtime | Optional comma-separated exact browser origins; configure for public hosting |
| `MATCH_SECONDS` | Node runtime | `300`; integer 10–3600, useful for private QA |
| `PHYSICS_DEBUG` | Node runtime | `1` enables debug geometry outside production; use Vite with `?physics=1` |
| `VITE_GAME_SERVER_URL` | Vite build | Same-origin `/ws`; use `wss://game.example.com/ws` for separate hosting |
| `SITE_DOMAIN` | Docker Compose / Caddy | Your public domain |
| `TEST_SERVER_URL` | Network tests | Optional already-running server override |

Vite reads `.env` during its build. Set Node runtime values in your shell or hosting dashboard; the server does not automatically load a `.env` file. Never place secrets in a `VITE_` variable.

## Tests

```sh
npm test
npm run benchmark
npm run build
npx playwright install chromium
npm run test:browser
```

The browser suite starts a separate persistent server on port 3102 with 30-second rounds. It uses real WebSockets, physics, input and countdowns; no client score injection or simulated network players. Production remains five minutes. Screenshots are written to `test-results/`.

Graphics presets are available in Settings. All maps share the same 115 × 90 × 24 m competitive shell and traction. Map scenery is generated only for the selected stadium, with a loading progress overlay. Models are generated as skinned meshes (17,784–25,920 triangles at LOD0), so there are no large external texture/model downloads.

See [TESTING.md](TESTING.md) for verified results and remaining coverage limits, and [PHYSICS_REVISION.md](PHYSICS_REVISION.md) for tuning, measurements and debug controls.

## Deploy

The simplest deployment serves both the built static client and WebSockets from one persistent Node container behind TLS.

1. Provision a Linux host with Docker and a domain pointing at its public IP.
2. Copy this project, including the lockfile. Set `SITE_DOMAIN` to that domain in the deployment environment or a Compose `.env` file.
3. Allow ports 80 and 443 on that host. The game container port stays internal to the Compose network.
4. Run `docker compose up -d --build`. Caddy handles HTTPS and proxies WebSocket upgrades to the persistent game process.
5. Open `https://YOUR_DOMAIN` in two browsers on different networks and repeat the multiplayer checklist. Inspect `/health` and container logs.

Alternatively build the frontend with `VITE_GAME_SERVER_URL=wss://YOUR_SERVER/ws`, upload `dist/` to a static host, and deploy `npm start` as a persistent Node service. Set `ALLOWED_ORIGINS` to the static site's exact HTTPS origin. Do not use request-only serverless functions for the match server. Start with one server instance; scaling to multiple instances needs shared room routing, which is not provided.

## Limits

This build uses original procedural skinned models with three LODs, selected-map generation and synthesized sounds. It has no AI opponent, touch/gamepad input, account system, progression or imported GLB assets. Local prediction is bounded and does not compensate collision latency; real WAN jitter and packet-loss feel remain unverified. Camera collision avoidance uses arena bounds rather than general scene raycasts. Graphics settings offer Low, Medium and High presets without altering physics. No public deployment, Docker execution, cross-network WAN test or measured laptop frame-rate benchmark is claimed.
