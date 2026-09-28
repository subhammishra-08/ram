# StickTuber: Cyber Beat Brawl ⚡🥊

> **The Ultimate Professional 2-Key Rhythm Brawler & Livestreaming Simulator**  
> Inspired by *Stick Tuber: Punch Fight Dance*, *One Finger Death Punch*, and EDM rhythm gaming.

---

## 🎮 About The Game

In **StickTuber**, you are a stickman martial artist livestreaming combat tournaments to millions of concurrent viewers across the multiverse. Waves of enemy stickmen rush in from the left and right in sync with dynamic synthesized EDM beats.

With just **TWO keys / touch buttons** (Left and Right):
- Strike enemies as they enter your neon strike zone on the beat.
- Score **PERFECT!** timing combos for massive audience hype.
- Unleash dynamic martial arts choreographies: jabs, flying dragon kicks, rising uppercuts, katana slashes, and nunchaku flurries.
- Fill the **Overdrive Fever Gauge** to trigger golden Super Saiyan form and wipe the entire screen.
- Dodge whiffs, defeat armored brawlers and rival streamer bosses, earn subscriber play buttons, and upgrade weapons and gear in the shop!

---

## ✨ Features

- **2-Key Precision Combat Engine**:
  - Intuitive 2-button input (`A` / `D`, `◄` / `►`, or on-screen touch pads).
  - Clear hit range brackets and rhythm sweet spots.
  - Punishing whiff penalty for mistimed strikes.
- **Procedural Synthesized Web Audio EDM Engine**:
  - 4 original, sample-accurate synthesized EDM tracks (128 to 168 BPM):
    1. *Neon Nightlife* (128 BPM - Upbeat Synthwave / Electro)
    2. *Cyber Brawler* (140 BPM - Aggressive Midtempo Darksynth)
    3. *Dragon Drift* (154 BPM - Pentatonic Trapstyle Beat)
    4. *Overdrive Apex* (168 BPM - Speed Rave Trance)
  - Full procedural combat sound effects (punches, katana slashes, staff bonks, nunchaku whooshes, combo chimes, crowd cheers, superchat bells).
  - Audio visualizer with real-time frequency bars dancing in the arena background.
- **Kinematic Stickman Rigging & Ragdoll Physics**:
  - Full skeletal bone hierarchy (head, spine, shoulders, elbows, fists, hips, knees, feet).
  - Flying ragdoll knockbacks on fatal blows with disintegration sparks.
  - Smooth animation transitions between 10+ martial arts stances.
- **Realistic Livestreamer Simulation**:
  - Real-time concurrent viewer counter scaling dynamically with combos and hype.
  - Interactive live chat feed with authentic streamer reactions, moderator alerts, and viewer banter.
  - Super Chat donation popups giving bonus stream cash ($).
  - Post-stream broadcast analytics (Ratings: S+, S, A, B, C; peak viewers; new subscribers; ad revenue).
- **Gear Shop & Customization**:
  - **Weapons**: Cyber Knuckles, Neon Katana (+25% range), Pulse Nunchaku (+30% combo), Bo Staff (+40% knockback), Dual Plasma Sabers (+50% score).
  - **Headgear**: Red Ninja Bandana, Cyber HUD Visor, RGB Cat-Ear Headset, Saiyan Golden Hair, Demon Horns.
  - **Studio Themes**: Neon Cyber Dojo, Neo Shinjuku Skyline, Synthwave Sunset, Digital Matrix.
- **Multiple Game Modes**:
  - **Career Tour**: Progressive song stages with star ratings, escalating difficulty, and boss duels.
  - **24/7 Endless Stream**: Infinite scaling survival wave to test reflex limits.
- **Responsive & Accessible Controls**:
  - Desktop keyboard: `A`/`D`, `◄`/`►`, `J`/`L`, `Space`, `Esc`.
  - Mobile & Tablet: Fullscreen responsive touch buttons with tactile glowing feedback.
  - Audio volume sliders and mute button.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Punch / Kick Left** | `A` or `◄` or `J` | Tap Left Hit Zone |
| **Punch / Kick Right** | `D` or `►` or `L` | Tap Right Hit Zone |
| **Overdrive Fever Burst** | `Space` or `W` or `▲` | Tap Golden Fever Button |
| **Pause / Resume** | `Esc` or `P` | Tap ⏸️ Button |

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 🛠️ Architecture

```
├── index.html                  # Main UI & Streamer HUD layout
├── vite.config.js              # Vite server configuration (0.0.0.0 binding)
├── src/
│   ├── main.js                 # App lifecycle bootstrap
│   ├── style.css               # Neon cyberpunk styles & glassmorphic HUD
│   ├── audio/
│   │   └── AudioEngine.js      # Web Audio API procedural synthesizer & SFX
│   ├── engine/
│   │   ├── GameEngine.js       # Main 60+ FPS Canvas loop & combat coordinator
│   │   ├── StickmanRenderer.js # Kinematic skeletal animation & pose math
│   │   ├── EnemyManager.js     # Rhythm wave spawner & multi-hit mechanics
│   │   └── ParticleSystem.js   # Sparks, shockwaves, slash arcs & screen trauma
│   ├── systems/
│   │   ├── StreamerSystem.js   # Viewer counter, chat generation & superchats
│   │   └── SaveManager.js      # LocalStorage persistence for gear & stats
│   └── ui/
│       ├── UIManager.js        # DOM HUD, modals, touch events & menus
│       └── ShopManager.js      # Equipment catalog & purchase validation
```
