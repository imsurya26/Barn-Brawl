# Testing

Run from the repository root with Node.js 24 and dependencies installed using `npm ci`.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

`npm run benchmark` runs the physics calibration subset. `npm run build` includes TypeScript checking. Build before browser tests because their server serves `dist/`.

## Coverage

- `tests/*.test.ts`: 34 physics, gameplay, model/cosmetic, prediction, and real WebSocket tests.
- `tests/browser/game.spec.ts`: two players, room/loadout/map selection, real keyboard movement, scoring, jumping, victory, rematch, and overtime.
- `tests/browser/gameplay-upgrade.spec.ts`: camera, abilities, audio, map, and graphics checks.
- `tests/browser/maps-latency.spec.ts`: controlled network-latency scenarios.
- `tests/browser/pickup.spec.ts`: keyboard-driven pickup and replicated activation, including readable event labels.

The browser suite runs its own server on localhost port 3102 with 30-second rounds. Production matches remain five minutes. Tests must not run against an unrelated process on that port. Screenshots and runner output go to ignored `test-results/`; retained local evidence lives in ignored `artifacts/`.

## Verified release — 10 October 2026

The 1.6 m radius ball release passed all 34 automated tests and the production build. Local two-browser match and pickup scenarios passed after the ball change; the earlier full browser suite also passed. A live Vercel-to-Render two-browser test passed create/join, loadout/map selection, ready/start, camera, movement/boost replication, physical scoring, jump, and flip. The final live repeat checked page and console errors and passed with a 15-second hosted-server assertion timeout. A preceding repeat exceeded the local five-second countdown timeout; gameplay code was unchanged.

Render reported the server live and its error search returned no matching logs. Nonfatal warnings remain for Vite bundle size and Rapier initialization deprecation.

## Coverage limits

Live five-minute endings, rematch/overtime, sustained public load, and cold-start recovery are not fully tested. Victory/rematch/overtime passed locally with shortened rounds. Passing a unit test does not substitute for browser or public-network testing. Tests do not establish mobile/gamepad support or a production capacity guarantee.

Earlier reports are retained in [archive/](archive/). Their local process URLs, ball dimensions, screenshots, and measurements are historical; use the current [deployment guide](DEPLOYMENT.md) for hosting details.

## Repository cleanup — 10 October 2026

Moved historical reports into `docs/archive/`, added current architecture/testing guides, refreshed the root README, formatted package metadata, and excluded local artifacts and environment variants from Docker build context. Removed only the disposable local npm cache; retained test evidence and all gameplay code/assets. All 34 automated tests were rerun after these changes. No gameplay source imports or test assertions were changed.
