# Barn Brawl

**Animals. Rocks. Absolute chaos.**

A browser-based multiplayer sports game: pick a farm animal, boost across the arena, and knock a giant rock into the opposing goal. Built with TypeScript, Three.js, Rapier 3D, and an authoritative Node.js WebSocket server.

**[Play now](https://barn-brawl.vercel.app)** · [Deployment guide](docs/DEPLOYMENT.md) · [Testing guide](docs/TESTING.md) · [Architecture](docs/ARCHITECTURE.md)

## Features

- Up to four human players per room, plus solo practice.
- Goat, Pig, Cow, and Chicken, each with a distinct ability.
- Four arenas, five cosmetic boost styles, boost pads, and five carried powerups.
- A 3.2 m diameter ball with server-owned rigid-body physics.
- Jump, double-jump, aerial dodge, air control, powerslide, and boost.
- Rock/player camera modes, camera presets, graphics options, and saved preferences.
- Goals, assists, saves, commentary, match statistics, victory stage, rematch, and sudden-death overtime.
- Five-minute matches, private room codes, and automatic team balancing. No account required.

## Quick start

Install **Node.js 24 LTS** (the version used for deployment) and npm.

```sh
git clone https://github.com/imsurya26/Barn-Brawl.git
cd Barn-Brawl
npm ci
npm run dev
```

Open **http://localhost:5173**. This starts the Vite client and game server together; Vite forwards WebSocket traffic to port 3001. No environment file is required for local development.

To run the production build locally:

```sh
npm run build
npm start
```

Open **http://localhost:3001**. The server also exposes `/health`.

## Play with friends

1. Open the [live game](https://barn-brawl.vercel.app), enter a nickname, and choose **Play / Create Room**.
2. Share the five-character room code. Other players choose **Join Room** and enter it.
3. Choose your animal and boost style. The host selects the arena.
4. Everyone marks themselves ready; the host starts the match.
5. Score by sending the entire ball through the opposing goal. A tied timer enters sudden-death overtime.
6. After the victory screen, the host can rematch or return everyone to the lobby.

The free game server sleeps when inactive. On the first visit, allow about a minute for it to wake; refresh or reconnect if needed. For local play on another device, use the host computer's LAN address instead of `localhost` and allow the relevant port through its firewall.

## Controls

| Key / input | Action |
| --- | --- |
| W / S | Accelerate / brake and reverse; pitch in air |
| A / D | Steer; yaw in air |
| Space | Jump; hold for height, release and press again for double-jump |
| Space + direction while airborne | Aerial dodge |
| Shift | Boost |
| Z / C | Air roll |
| Left Ctrl | Powerslide |
| Q | Toggle Rock Cam / Player Cam |
| R | Reset follow camera |
| Mouse / scroll wheel | Orbit / zoom |
| E | Use carried powerup |
| F | Use animal ability |

Camera, graphics, accessibility, and audio settings are available in-game. Keyboard and mouse are the supported inputs; touch and gamepad controls are not implemented.

## Project layout

```text
client/                 Browser application
  audio/                Sound and commentary playback
  camera/               Follow camera, presets, and persistence
  effects/              Cosmetic boost particles
  input/                Keyboard controls
  network/              WebSocket connection and local prediction
  rendering/            Animals, arenas, scenery, and render loop
  ui/                   Menu, lobby, HUD, settings, and results
server/                 Authoritative rooms, gameplay, HTTP, and physics
shared/                 Rules, maps, movement model, and message validation
public/audio/           Commentary clips and manifest
scripts/                Asset generation and diagnostic utilities
tests/                  Physics, gameplay, networking, and browser tests
docs/                   Current architecture, testing, and deployment guides
  archive/              Historical implementation and verification reports
deploy/                 Optional Caddy reverse-proxy configuration
```

Tool configuration stays at the repository root so npm, TypeScript, Vite, Playwright, Docker, Render, and Vercel discover it normally. Generated `dist/`, `test-results/`, `artifacts/`, caches, dependencies, and local environment files are excluded from Git.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start client and server with development reload |
| `npm run dev:client` | Start Vite only |
| `npm run dev:server` | Start the server in watch mode |
| `npm run build` | Type-check and build the browser application |
| `npm start` | Serve the built game and WebSockets |
| `npm test` | Run server, physics, gameplay, and networking tests |
| `npm run benchmark` | Run physics calibration checks |
| `npm run test:browser` | Run real Chromium multiplayer scenarios |

Before the first browser-test run:

```sh
npm run build
npx playwright install chromium
npm run test:browser
```

The browser suite starts its own server on port 3102 with shortened rounds. See the [testing guide](docs/TESTING.md) for coverage and limits.

## Configuration

| Variable | Used by | Default / purpose |
| --- | --- | --- |
| `HOST` | Server | `0.0.0.0` |
| `PORT` | Server | `3001` |
| `MATCH_SECONDS` | Server | `300`; accepts 10–3600 |
| `ALLOWED_ORIGINS` | Server | Optional comma-separated exact browser origins |
| `PHYSICS_DEBUG` | Server | `1` enables debug geometry outside production |
| `VITE_GAME_SERVER_URL` | Client build | Same-origin `/ws`; set a `wss://` URL for separate hosting |
| `SITE_DOMAIN` | Docker Compose / Caddy | Public domain for the optional self-hosted setup |

Vite reads build variables from `.env`; server runtime variables must be set in the shell or hosting dashboard. The server does not automatically read `.env`. See [.env.example](.env.example). Never put secrets in a `VITE_` variable: its value becomes public client code.

## Deployment

The live frontend runs on **Vercel** and the multiplayer server on **Render**, using `vercel.json`, `render.yaml`, and `Dockerfile`. The server runs as one persistent instance because rooms live in memory. Keep the frontend's WebSocket URL and the server's allowed origins in sync.

The [deployment guide](docs/DEPLOYMENT.md) includes the live endpoints, configuration, and optional Docker/Caddy hosting. A successful frontend build alone does not prove multiplayer is connected.

## Verification and limitations

The larger-ball release passed 34 automated tests, the production build, local full-match browser scenarios, and a live two-browser Vercel-to-Render gameplay check. Live checks covered room creation/joining, loadouts, ready/start, movement, boost, camera, jumping, a physical goal, and score agreement. The final live check captured no page or console errors.

Full victory/rematch/overtime flows were verified locally with shortened rounds. Sustained public load, free-host cold-start recovery, and long-running live matches are not fully tested. Free hosting can sleep or restart, clearing active rooms. Multi-server room routing, persistent accounts, bots, and progression are not implemented. Physics collisions remain server authoritative; local prediction does not eliminate network latency.

See [docs/TESTING.md](docs/TESTING.md) for the current evidence and [docs/archive/](docs/archive/) for historical reports. Historical measurements describe their respective versions, not necessarily today's game.
