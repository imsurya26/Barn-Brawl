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

## Live deployment — 10 October 2026

- Play: https://barn-brawl.vercel.app
- Server health: https://barn-brawl-server.onrender.com/health
- WebSocket: wss://barn-brawl-server.onrender.com/ws
- GitHub: https://github.com/imsurya26/Barn-Brawl
- Verified game release: 485b3692a9171beef65af62cca753e5818e1151c; deployment configuration record: 4d30eeff3e8ec333f03c070b9683d258e70f9afd.
- Verified production deployment at publication: dpl_2AMt98eWfpYVvuYPVYbXRRN6NCSq (READY). Later pushes create new deployments.
- Render service: srv-db4n7qvlk1mc73d8evog, Docker Free, Singapore.

IMPLEMENTED AND TESTED: larger ball, 34 automated tests, production build/TypeScript, local two-browser full match including victory/rematch/overtime, and local pickup/use regression. The live Vercel-to-Render two-browser check passed create/join, animal/boost/map selection, ready/start, camera toggle, replicated movement/boost, physical goal and equal scores, celebration return, jump and flip. No page runtime errors were captured in the live check.

IMPLEMENTED BUT NOT FULLY TESTED: live five-minute match ending/rematch/overtime (verified locally with shorter matches), free-host cold start/recovery and sustained public load. Render logs contain a nonfatal Rapier initialization deprecation warning; Vite reports a nonfatal large-chunk warning.

REQUIRES EXTERNAL INFRASTRUCTURE: paid always-on hosting would be needed for stronger availability; no paid service was purchased. Free Render hosting can sleep and lose in-memory matches on restart. If the first connection times out while waking, wait about a minute and reconnect or refresh.

The Render service was created from the public repository URL. A subsequent GitHub push triggered automatic deployments on both Render and Vercel. Verify both deployments after future changes; use a manual deployment if an automatic one does not start. Vercel Preview URLs are not included in the server origin allowlist; add an exact preview origin deliberately if multiplayer preview testing is required.

## Optional Docker / Caddy hosting

For a self-managed Linux host with Docker and a domain pointing to it, set `SITE_DOMAIN` for `compose.yaml`, allow ports 80 and 443, and run `docker compose up -d --build` from the repository root. Caddy uses `deploy/Caddyfile` for TLS and WebSocket forwarding. Keep the game service internal to the Compose network. This alternative has not been executed as part of the hosted release verification.
