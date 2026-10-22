# LinkedIn Caption — Barn Brawl

> **Paste the text below directly into your LinkedIn post.**
> Upload 3–5 screenshots from `screenshots/` with the post for maximum engagement.

---

## Post Text

Recently got free access to GPT-6 Astra, and my first thought was: *how far can you actually push AI-assisted game development?* The answer — apparently — is a fully playable browser multiplayer physics sports game. 🐄🐐🐷🐔

So I built **Barn Brawl**.

It's a 3D multiplayer arcade sports game where you pick a farm animal, blast across a stadium, and knock a giant rock into the opponent's goal. Think chaotic physics meets competitive sports, wrapped in a barnyard theme. It runs entirely in the browser — no download, no install.

**Here's how it works:**
- Up to 4 players share a private room code
- Each player picks an animal (Goat, Pig, Cow, or Chicken), a boost style, and the host picks the map
- You race to score goals by launching a 3.2m rock into the opposing net before the 5-minute timer runs out — tied matches go to sudden-death overtime
- Every animal has a unique special ability: Goat charges and empowers rock hits, Chicken gets aerial lift, Pig belly-bounces rivals, Cow stomps the ground
- Five boost styles, five different powerups you can pick up mid-match (Power Shot, Magnet, Shield, Speed Surge, Shockwave), and four arenas each with their own lighting and vibe

The tech stack: **TypeScript + Three.js + Rapier3D** for rendering and physics, a **Node.js WebSocket server** for authoritative multiplayer state, deployed on **Vercel + Render**.

Getting the physics right was genuinely hard — server-authoritative rigid-body simulation at 120 Hz with client-side prediction, lag compensation, and a rock that *actually feels* satisfying to hit. Rapier3D did the heavy lifting, but tuning it was an iterative process that took many rounds of testing. GPT-6 Astra was a fantastic pair-programming partner throughout: it helped me reason through physics constraints, debug edge cases, draft and refactor systems rapidly, and think through multiplayer architecture. That said — every design decision, every playtest, every "this feels wrong, let's fix it" moment was mine.

This started as a weekend experiment. It grew into something I'm genuinely proud of. And it was one of the most fun development experiences I've had.

It's not a polished commercial product — it's a passion experiment. But it's **live, free, and playable right now.**

---

🎮 **Play Barn Brawl:** https://barn-brawl.vercel.app/
*(Open in a desktop browser, no account needed)*

💻 **GitHub:** https://github.com/imsurya26/Barn-Brawl

---

If you try it — let me know what you think. Would love to hear if anyone actually scores a goal. 🏆

#GameDevelopment #WebDevelopment #ThreeJS #TypeScript #AI #AIAssistedDevelopment #IndieGameDev #Multiplayer #Physics #BuildInPublic #JavaScript #OpenSource
