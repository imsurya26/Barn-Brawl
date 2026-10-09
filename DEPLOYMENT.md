# Barn Brawl hosting

The browser frontend deploys to Vercel. The authoritative 120 Hz physics server runs as one persistent Render web-service instance. Do not horizontally scale this in-memory server: separate instances would have separate rooms.

## Render server

Use the repository's `render.yaml` Blueprint, or create a Docker web service from `imsurya26/Barn-Brawl`, branch `main`, with the Free plan and Singapore region. The Blueprint sets port 3001, host 0.0.0.0, production mode, a five-minute match and `/health` checks. The service uses the existing Dockerfile.

Free instances may restart and sleep after 15 minutes without incoming traffic. Waking can take approximately a minute. Match state is not durable across process restarts. This is suitable for a hobby preview, not an uptime guarantee. No paid plan is authorized by this configuration.

After Render reports a successful deployment, verify its HTTPS `/health` URL and record the actual assigned hostname. The WebSocket URL is `wss://<assigned-hostname>/ws`.

## Vercel frontend

Import `imsurya26/Barn-Brawl` as a Vite project. `vercel.json` selects `npm run build` and output directory `dist`.

Before deployment, set `VITE_GAME_SERVER_URL` in Vercel's Production and Preview environments to the actual Render WebSocket URL. Rebuild after changing this variable because Vite embeds it at build time. Never use localhost for the deployed frontend.

Once the Vercel domain is known, set Render's `ALLOWED_ORIGINS` to the exact HTTPS frontend origins, comma separated (no trailing slash), plus the Render HTTPS origin if using the server's own frontend. Updating/redeploying the server ends active rooms, so do it before sharing the game.

Verify two independent browsers on the deployed frontend: both must show ONLINE, join the same room, exchange movement and agree on the score. A successful static-site build alone does not verify multiplayer deployment.

## Ball enlargement — 10 October 2026

The ball radius is now 1.6 m, up from 1.15 m: diameter 3.2 m, approximately 39% larger. Rendering, collider, spawn height and goal checks share this constant. Mass and movement tuning are unchanged. Physics-test fixtures place the ball relative to its current radius.

All 34 automated tests passed after the enlargement. Production build and TypeScript checks passed. The real two-browser match passed through goal, victory, rematch and overtime. Earlier reports describe the prior ball size and remain historical.
