# Higgsfield AI & Seedance 2.5 Trailer Package — Barn Brawl

This package connects **Barn Brawl** real gameplay references with **Higgsfield AI MCP** and **Seedance 2.5** for cinematic gameplay trailer generation.

- **Game:** Barn Brawl
- **Live Game:** https://barn-brawl.vercel.app/
- **GitHub:** https://github.com/imsurya26/Barn-Brawl
- **Higgsfield MCP Endpoint:** `https://mcp.higgsfield.ai/mcp`
- **Model:** `seedance_2_5` (Bytedance Seedance 2.5 text-to-video with multimodal omni-reference)

---

## 📸 Uploaded Reference Images in Higgsfield Cloud

All 9 real gameplay screenshots from `artifacts/verification` and `artifacts/gameplay-upgrade/final` have been presigned, uploaded to S3, and confirmed in your Higgsfield account:

| Reference File | Higgsfield `media_id` UUID | Content / Role |
|----------------|----------------------------|----------------|
| `01_opening_reference.png` | `bc8a4582-5bbf-4e58-95a4-0efc4df22fa3` | Barnyard Bowl Stadium panoramic view |
| `02_action_reference.png` | `9d9df985-e85a-43e2-b6a7-0f77754d7348` | Goat character on field gameplay |
| `03_ball_hit_reference.png` | `c66eea8f-b11c-4827-8aec-23ffdf685029` | Dynamic camera action view |
| `04_goal_reference.png` | `99508e49-4205-40d5-bad6-a4f1b646b05d` | Trailblazers Goal celebration |
| `05_map_reference.png` | `2e88f550-053f-46c1-a717-23d746371265` | Harvest Moon night arena with moon |
| `06_victory_reference.png` | `0bb42649-f809-48ba-8e6e-421b75f6c967` | Match end / victory stage |
| `07_lobby_reference.png` | `c15e4648-d668-4dcc-926d-aa195a679284` | Pre-match lobby ("Meet your farm team") |
| `08_menu_reference.png` | `3f4dc2b5-da9c-453f-9e18-51ee6f1bddbf` | Title menu ("Animals. Rocks. Absolute chaos.") |
| `09_animals_reference.png` | `c176875a-7f09-4075-a277-21fa2164e660` | 3D animal rigs (Goat, Pig, Cow, Chicken) |

---

## 🎬 10-Shot Generation Payloads (Seedance 2.5 via Higgsfield MCP)

### Shot 1 — Cinematic Stadium Reveal (~5 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `bc8a4582-5bbf-4e58-95a4-0efc4df22fa3` (role: `start_image`)
- **Prompt:**
  ```text
  Wide cinematic establishing shot of a large farm-themed sports arena. Green turf playing field with painted team markings. Stylized goal posts with glowing orange goal nets at each end. Packed stadium stands with a crowd of spectators. Bright stadium floodlights casting dramatic light across the field. Camera slowly pushes forward from above the crowd into the arena. Four cartoon farm animals (Goat, Pig, Cow, Chicken) trot onto the field from opposite sides. Daytime, warm golden sunlight. Energetic, colorful, cheerful atmosphere. Stylized 3D animation. No text on screen.
  ```

### Shot 2 — Animal Character Reveal (~5 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `c176875a-7f09-4075-a277-21fa2164e660` (role: `image_references`)
- **Prompt:**
  ```text
  Four quick hero cuts in rapid succession: first a confident white Goat with curved horns, then a round pink Pig, then a large black-and-white Cow, then a small orange-yellow Chicken. Each animal fills frame briefly in a dynamic pose — jumping, charging, or celebrating. Stylized cartoon 3D. Colorful, fun, high energy. Farm arena background glimpsed behind each animal. No HUD. No text.
  ```

### Shot 3 — Kickoff — The Rock Drops (~4 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `bc8a4582-5bbf-4e58-95a4-0efc4df22fa3` (role: `start_image`)
- **Prompt:**
  ```text
  A massive stylized boulder (roughly 3 metres across, grey textured rock surface) drops from above onto the centre of a farm-themed sports field. Dust and turf particles explode on impact. Two teams of cartoon farm animals on opposite sides charge toward the rock simultaneously. Low Dutch-angle tracking camera follows the rock as animals converge. Dramatic, chaotic energy. Stylized 3D. No text.
  ```

### Shot 4 — Speed and Boost (~4 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `9d9df985-e85a-43e2-b6a7-0f77754d7348` (role: `image_references`)
- **Prompt:**
  ```text
  A cartoon farm animal (white goat) boosts at full speed across a farm stadium turf. A vivid particle trail fires from behind with golden hay particles, orange sparks, and dust. Low tracking camera close to the ground follows the animal, slight motion blur on the trail. Speed lines and dust. Fast, kinetic, exciting. Stylized 3D. No text.
  ```

### Shot 5 — Physics Hit — Rock Launches (~4 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `c66eea8f-b11c-4827-8aec-23ffdf685029` (role: `start_image`)
- **Prompt:**
  ```text
  A cartoon Goat leaps and spins in mid-air then slams into the large grey rock boulder with its horns. Massive shockwave impact effect ripples out. The rock launches at high velocity toward the far end of the farm arena. Camera follows the rock with a fast dolly. The stadium crowd reacts visibly. Satisfying, powerful, impactful. Stylized 3D animation. No text.
  ```

### Shot 6 — Powerups & Ability (~5 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `9d9df985-e85a-43e2-b6a7-0f77754d7348` (role: `image_references`)
- **Prompt:**
  ```text
  First beat: a glowing pickup diamond icon on the turf of the farm arena. A cartoon Pig runs through it and an electric shockwave effect radiates outward from the animal. Second beat: the Pig leaps high, bounces on landing, and nearby rival animals scatter outward from the impact. Split-screen or fast cut between the two moments. Stylized 3D. Colorful effects. No text.
  ```

### Shot 7 — Multiplayer Chaos (2v2) (~5 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `bc8a4582-5bbf-4e58-95a4-0efc4df22fa3` (role: `image_references`)
- **Prompt:**
  ```text
  All four cartoon farm animals challenging the rock at once in a farm sports arena — two orange-team animals and two blue-team animals. Animals jump, spin, and collide around the large grey rock boulder. Boost trails in multiple colors. The rock bounces chaotically. Overhead orbit camera then cuts to a low ground-level tracking shot. Crowd cheering visible in the background. Wild, fun, anarchic. Stylized 3D. No HUD. No text.
  ```

### Shot 8 — Goal Scored (~5 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `99508e49-4205-40d5-bad6-a4f1b646b05d` (role: `start_image`)
- **Prompt:**
  ```text
  The large grey rock rolls into a glowing orange goal net at the end of a farm stadium. Goal-post frame lights up. Explosion of particles, confetti, and colorful light beams from the goal. Crowd erupts with arms raised. The scoring cartoon animal slides on the turf in celebration. Camera pulls back in slow-motion to reveal the full stadium celebrating. Cinematic, triumphant, satisfying. Stylized 3D. No text.
  ```

### Shot 9 — Victory Stage (~4 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `0bb42649-f809-48ba-8e6e-421b75f6c967` (role: `start_image`)
- **Prompt:**
  ```text
  The winning team of cartoon farm animals stands on a raised victory platform in the farm arena. Confetti rains down. The winning animals do a celebration animation — jumping, spinning, or flexing. Spotlights and golden lighting. The losing animals visible in the background. Camera slowly orbits the winners. Triumphant, warm, cheerful. Stylized 3D. No text.
  ```

### Shot 10 — Final Hero Frame (~4 s)
- **Model:** `seedance_2_5`
- **Aspect Ratio:** `16:9` | **Duration:** `5`
- **Reference Image:** `2e88f550-053f-46c1-a717-23d746371265` (role: `start_image`)
- **Prompt:**
  ```text
  Wide panoramic shot of the Barn Brawl farm arena under a dramatic night sky with full moon. Slow cinematic push-in from the stadium exterior toward the field. The four cartoon farm animals pose heroically on the field with the large rock between them. Clean, open composition in the centre of frame. Leaves a large clean space in the upper third and lower third for title and URL overlay. Stylized 3D. No text inside the frame.
  ```

---

## ⚡ Execution Options

### Option A: Via Higgsfield MCP (Direct API)
- **Status:** Higgsfield account connected via MCP.
- **Requirement:** Higgsfield requires an active Plus plan or credit balance (cost is 35 credits per clip).
- Once credits are added to your Higgsfield account, the clips can be generated directly through this chat session using `generate_video`.

### Option B: Via Dreamina / CapCut Seedance Web
- Navigate to **Dreamina** (CapCut Seedance).
- Select **Seedance 2.5**.
- Upload the corresponding images from `LinkedIn/trailer_references/` (or use the cloud URLs above).
- Paste the shot prompts one by one.

### Post-Production: Assembly & Text
Assemble the clips in your video editor (CapCut, Premiere, etc.), and add title overlays over Shot 10:
```text
BARN BRAWL
PLAY FREE: barn-brawl.vercel.app
GITHUB: github.com/imsurya26/Barn-Brawl
```
