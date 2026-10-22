# Project Summary — Barn Brawl

## Live Demo

🎮 **Play Barn Brawl (live, free, no account required):**
https://barn-brawl.vercel.app/

Open the link in any modern desktop browser (Chrome, Edge, Firefox). No install, no signup. Multiplayer works via private room codes. The game server may take ~60 seconds to wake from sleep on the first visit — just refresh if needed.

---

## What Is Barn Brawl?

Barn Brawl is a browser-based multiplayer 3D arcade physics sports game. Players choose a farm animal, boost across a large farm-themed stadium, and try to knock a giant rock (3.2 m diameter) into the opposing team's goal. It is deliberately chaotic, physics-driven, and competitive.

The game was built as an experimental AI-assisted development project using GPT-6 Astra as a pair-programming partner, with all design decisions, gameplay direction, and testing done by the developer.

---

## Core Features (Verified Implemented)

### Multiplayer
- Up to 4 players per room (private 5-character room code)
- Authoritative server: physics runs at 120 Hz on a dedicated Node.js server
- Client-side prediction + snapshot interpolation for smooth feel
- Host migration, automatic team balancing, reconnect grace period
- Solo practice mode available (single player)

### Animals
| Animal  | Special Ability |
|---------|----------------|
| Goat    | Ram Rush — charge forward, empower one rock hit |
| Pig     | Belly Bounce — hop and push nearby rivals on landing |
| Cow     | Ground Stomp — ground pulse pushing rivals and rock |
| Chicken | Wing Burst — brief lift and stronger aerial control |

### Rock / Ball
- 3.2 m diameter rigid-body sphere
- Server-owned physics (authoritative)
- Realistic bounce, spin, speed cap (60 m/s CCD)
- Responds to animal mass and velocity on contact

### Boost & Cosmetics
- Boost resource (0–100), drains during use, regens passively
- 5 cosmetic boost styles: Dust Dash, Hay Burst, Spark Trail, Wind Rush, Poop Chaos
- Boost pads (small/large) placed around the arena

### Powerups
Collectable pickups spawn on the field:
- **Power Shot** — next hit strikes harder
- **Magnet Pulse** — briefly draws rock toward you
- **Shield** — softens incoming knockback
- **Speed Surge** — burst of extra acceleration
- **Shockwave** — short-range pulse pushes rivals and rock

### Maps / Arenas
| Map ID    | Name                  | Theme |
|-----------|-----------------------|-------|
| barnyard  | Barnyard Bowl         | Sunny countryside afternoon |
| harvest   | Harvest Moon Arena    | Autumn night under stars |
| frostbite | Frostbite Ranch       | Blue-hour snowy peaks |
| canyon    | Sunset Canyon Ranch   | Golden desert skies |

### Camera
- Follow camera with orbit, zoom, and reset (R)
- Rock Cam mode (Q) — camera locks to the rock
- Camera presets with saved preferences
- Graphics quality settings (Low / Medium / High)

### Match System
- 5-minute matches (configurable server-side)
- Sudden-death overtime on a tie
- Goals, assists, saves tracked per player
- Commentary audio clips for key events
- Crowd audio
- Victory stage with per-player statistics
- Host can rematch or return all to lobby

---

## Controls

| Key | Action |
|-----|--------|
| W / S | Accelerate / brake |
| A / D | Steer |
| Space | Jump (hold for height, press again for double-jump) |
| Space + direction (air) | Aerial dodge / flip |
| Shift | Boost |
| Z / C | Air roll |
| Ctrl | Powerslide |
| Q | Toggle Rock Cam / Player Cam |
| R | Reset camera |
| E | Use carried powerup |
| F | Use animal ability |
| Mouse / scroll | Orbit / zoom camera |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Rendering | Three.js (WebGL) |
| Physics | Rapier3D (WASM, server + client) |
| Language | TypeScript (strict) |
| Network | WebSocket (authoritative server) |
| Server | Node.js + tsx |
| Client build | Vite |
| Frontend hosting | Vercel |
| Game server hosting | Render (free tier, persistent WebSocket) |
| Containerization | Docker (optional self-host) |
| Tests | Node.js built-in test runner (34 tests) + Playwright browser tests |

---

## Architecture

```
client/        Three.js rendering, UI, input, prediction, audio
server/        Authoritative physics, rooms, gameplay, HTTP API
shared/        Types, rules, animal configs, map definitions
public/audio/  Commentary clips and manifest
tests/         34 server + browser automated tests
```

The server owns all physics. Clients send input frames; the server runs Rapier3D at 120 Hz and broadcasts snapshots at 30 Hz. Clients interpolate between snapshots and predict locally to reduce perceived latency.

---

## Deployment (Verified)

- **Frontend:** Vercel — https://barn-brawl.vercel.app/
- **Multiplayer server:** Render (free tier) — WebSocket at the configured endpoint
- Configuration via `vercel.json`, `render.yaml`, `Dockerfile`
- The Render server may sleep when idle; first connection may require ~60 s wake time

---

## Source Code

https://github.com/imsurya26/Barn-Brawl
