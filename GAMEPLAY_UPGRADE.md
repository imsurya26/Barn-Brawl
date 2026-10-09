# Barn Brawl — gameplay upgrade

Implemented in the existing Three.js / Rapier / WebSocket project. The server still advances at 120 Hz, sends snapshots at 30 Hz, and owns all collisions, timers, inventory, scoring and abilities. No client can submit a pickup, hit result, score or cooldown.

## Controls

| Input | Action |
|---|---|
| W / S | Accelerate, brake/reverse; air pitch |
| A / D | Steer; air yaw |
| Shift | Boost |
| Ctrl | Powerslide |
| Space | Tap for low jump, hold for height; release and press again for neutral double jump or directional dodge |
| Z / C | Air roll |
| Mouse movement over the arena | Manual camera orbit; never changes physics steering |
| Mouse wheel | Camera distance, saved locally |
| Q / R | Rock camera (toggle/hold setting) / re-center |
| E / F | Carried powerup / animal ability |

Jump press IDs survive input sampling and are acknowledged in prediction state. Key repeat cannot produce a second press. Countdown inputs are consumed so held Space does not create an accidental kickoff jump. A short suspension-probe loss does not automatically apply driving throttle as air pitch. No dodge comes from steering, boost or slide.

## Scale and camera

Rock visual/collider base radius is 1.6 m, diameter 3.2 m (enlarged on 10 October 2026 from 2.3 m). Neutral animal mesh heights are goat 1.6, pig 1.45, cow 1.75, chicken 1.4 m. Animation can extend the pose. The competitive chassis remains identical for every animal.

Settings persist distance (5–10), height (1.5–5), angle (-15 to -2), FOV (75–110), stiffness, swivel speed, goal transition speed, shake, invert Y, sensitivity, rock-camera hold/toggle, reduced motion and UI scale. Balanced, Close, Wide, Competitive and Cinematic presets and reset defaults are available. Orbit does not write to player input. Collision avoidance retains the arena-bound approach.

## Server-owned field systems

- 12 small boost pads: +12, four-second respawn; four large pads: refill to 100, ten-second respawn. Pads are symmetric and cannot refill every tick while occupied.
- Four symmetric special pickup positions, twenty-second respawn, one carried slot. Respawns rotate through the five item types using authoritative match ticks.
- Power Shot: one +6 m/s shaped rock contact, ten-second activation window.
- Magnet: two-second bounded pull within seven meters.
- Shield: three-second reduction of animal collision and ability knockback; never invulnerable to the rock.
- Speed Surge: two-second acceleration increase within the existing safe player speed cap.
- Shockwave: one falloff pulse inside five meters; bounded rival and rock impulses.
- Goat Ram Rush: .75-second acceleration, one +3 m/s rock bonus and at most one shove per rival; 12-second cooldown.
- Pig Belly Bounce: grounded hop, falloff landing pulse within four meters; 14-second cooldown.
- Cow Ground Stomp: grounded .35-second windup, 4.5-meter pulse, cancelled by leaving the ground; 15-second cooldown.
- Chicken Wing Burst: 1.25-second lift and additional aerial response, no hit bonus; 12-second cooldown.

Held E/F does not repeatedly activate. Invalid grounded activation consumes no cooldown. Inventory stays with the existing player on reconnect, rather than being granted again. Goal resets clear active transient effects; carried items and cooldowns persist. Rematch clears all inventory, timers, stats and pickups. Timers pause outside active play. Prediction falls back to authoritative interpolation during active powers/abilities so cosmetic prediction cannot invent their forces.

## Events and presentation

The server keeps a bounded ring of uniquely numbered events. Goals credit the last meaningful touch within 12 seconds; assists require a different teammate within five seconds of the same possession. Opponent touches break that assist chain. Own goals award the team score without a false opposing individual scorer. Saves require a projected own-goal trajectory and a deflection away from it. Shots require a sufficiently fast trajectory toward the opponent's goal and a per-player cooldown. Stats also track item and ability uses. MVP weights goals, assists, saves and shots.

The HUD includes E inventory, F cooldown, boost, team names/colors and event feed. Lobby shows animal identity, ability, boost style, readiness, host and measured socket ping once available. Menus include animal selection, how-to, settings, credits, private creation and room-code join.

The stadium adds 320 instanced spectators animated at a limited update rate, stands, flags, scoreboard, speakers and entrance scenery outside the field. Event-driven crowd energy decays after kickoff, shots, saves, goals, overtime and victory. Goals use animated back doors plus a three-second instanced burst, with hay/gold, harvest orange, ice/snow and canyon dust palettes/shapes. The short goal camera follows the goal/scorer. All celebration geometry is visual-only.

Match end stages animals on a podium, places winners first, shows the correct final score, MVP and per-player goals/assists/saves/shots, and offers host rematch or change-animal/lobby plus main menu. The camera move lasts eight seconds, then rests; skip stops the motion immediately. Controls never wait for that camera to finish. Winners use species-specific head, body or wing emotes. Running cadence, idle details, leaning, braking, jumping, impact/landing squash and ability poses also vary without moving the physics root.

## Original audio

`public/audio/` contains 29 offline-rendered WAV clips covering fourteen event categories, with two variants each and three for goals. Original scripts are in `commentary.json`; `scripts/generate-commentary.ps1` reproducibly renders them using the installed Windows Zira voice. No browser speech synthesis or runtime cloud TTS is used. Important goals/overtime/victory interrupt minor commentary; a bounded queue, cooldown and variant cycling prevent constant chatter.

Barnstorm Beat is an original 116 BPM, 16-bar pentatonic pluck/bass composition synthesized locally in Web Audio. Menu playback is lighter, match playback adds percussion, the final minute adds rhythm, overtime adds tension and victory adds a fanfare layer. Filtered noise and short chant tones form the crowd bed. Master, music, effects, commentary and crowd levels are independent and saved; zero is mute. Browser interaction unlocks audio.

## Changed files

- Rules/input: `shared/config.ts`, `shared/controller.ts`, `shared/protocol.ts`, new `shared/gameplay.ts`.
- Authority: new `server/gameplay.ts`, `server/room.ts`, `server/physics.ts`, `server/index.ts`.
- Controls/camera: `client/input/controls.ts`, `client/camera/follow.ts`, new `client/camera/settings.ts`, `client/network/prediction.ts`, `client/main.ts`.
- Presentation: `client/rendering/animals.ts`, `client/rendering/game.ts`, new `client/rendering/stadium.ts`, `client/ui/interface.ts`, `client/style.css`.
- Audio: `client/audio/sound.ts`, `public/audio/`, `scripts/generate-commentary.ps1`.
- Tests: new `tests/gameplay.test.ts`, new `tests/browser/gameplay-upgrade.spec.ts`, `tests/browser/game.spec.ts`, `tests/browser/maps-latency.spec.ts`, `tests/physics-revision.test.ts`, `playwright.config.ts`.
- Reports: README, TESTING, this report, historical physics-report notice. `scripts/trace-shot.ts` reproduces the opening rebound independently of the browser.

## Verification and limits

Production build and 34 automated server/physics/gameplay/network tests pass. The preserved calibration remains 14.100 m/s driving, 23.000 m/s boost, 3.008 seconds for a full boost tank, and .4-second braking. Tap/hold/double jump heights remain .710 / 2.341 / 4.741 m; the enlarged rock rebounds to 3.580 m from an eight-meter drop. A local four-player physics sample measured 0.249 ms mean / 0.368 ms p95 per tick against the 8.333 ms budget; this is a physics benchmark, not a full production capacity claim. Final browser results are recorded in TESTING.md.

These are original procedural assets and synthesized audio, not imported cinematic animation or human voice performances. Commentary intelligibility and music mixing have not had a human listening review. Four-human WAN matches, packet loss, native Firefox/Edge, a full five-minute browser match and hardware-specific 60 FPS are not verified. Browser checks use Chromium SwiftShader and shortened matches. Save attribution is deliberately conservative and does not model every future wall bounce. Prediction is bounded motor replay rather than full Rapier rollback. No public deployment is included. There is no matchmaking queue, gamepad/touch control or persistent account progression.
