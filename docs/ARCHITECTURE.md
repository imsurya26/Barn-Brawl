# Architecture

Barn Brawl keeps rendering and input in the browser and match authority on one persistent server. The existing folder boundaries mirror those responsibilities.

## Client

`client/main.ts` starts the input, connection, audio, UI, and rendering loops. `rendering/` owns procedural animals, selected-map scenery, interpolation, and visual effects integration. `camera/` owns the follow camera and saved camera settings. `network/connection.ts` handles WebSocket messages and reconnect attempts; `network/prediction.ts` handles bounded local movement prediction. `ui/interface.ts` renders menus, lobby, HUD, settings, and match results.

Preferences live in localStorage. Player tokens and match state stay in memory. Reloading the page loses the reconnect token.

## Server

`server/index.ts` serves built static files and `/health`, accepts `/ws` upgrades, validates messages, and manages room membership. `server/room.ts` owns the match lifecycle, scores, clock, player state, and snapshots. `server/physics.ts` runs Rapier rigid bodies and collision rules. `server/gameplay.ts` handles abilities, pickups, powerups, and gameplay events.

The simulation runs at 120 Hz with 30 Hz snapshots. Clients send controls rather than authoritative positions or scores. A match proceeds through lobby, countdown, playing, goal pause, and match end; tied regulation enters overtime. Rematches retain the room and players.

## Shared rules

`shared/config.ts` centralizes movement, arena, animal, ball, and boost tuning. `shared/controller.ts` supplies the movement model used for prediction. `shared/protocol.ts` defines and validates messages. `shared/maps.ts`, `shared/arena.ts`, and `shared/gameplay.ts` define common map geometry, abilities, powerups, and event types.

Change shared definitions when tuning values used on both sides. Cosmetic changes should not change authoritative physics. Run the relevant tests and production build after edits.

## Assets and utilities

Models and scenery are procedural; `public/audio/` contains the commentary manifest and clips. Keep every clip referenced by the manifest. `scripts/generate-commentary.ps1` regenerates commentary; the other scripts are developer diagnostics, not application entry points. See [scripts/README.md](../scripts/README.md).

## Deployment boundary

Vercel serves the client; Render runs the persistent game process. Rooms are in memory and are lost on process restart. Multiple server instances require room routing that is not implemented. See [deployment](DEPLOYMENT.md) and [testing](TESTING.md).
