// ============================================================================
// CORE GAME ENGINE - STICKTUBER: PUNCH FIGHT DANCE
// High-performance 60+ FPS Canvas loop, rhythm evaluation, and combat choreo
// ============================================================================

import { StickmanRenderer } from './StickmanRenderer.js';
import { EnemyManager } from './EnemyManager.js';
import { ParticleSystem } from './ParticleSystem.js';

export class GameEngine {
  constructor(canvas, audioEngine, streamerSystem, saveManager, shopManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audioEngine;
    this.streamer = streamerSystem;
    this.save = saveManager;
    this.shop = shopManager;

    this.stickmanRenderer = new StickmanRenderer();
    this.enemyManager = new EnemyManager();
    this.particles = new ParticleSystem();

    // Screen dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Player State
    this.player = {
      x: 0, // relative to center
      y: 0,
      facing: 1, // 1 = right, -1 = left
      state: 'idle',
      animProgress: 0,
      animDuration: 0.18,
      animTimer: 0,
      hp: 3,
      maxHp: 3,
      invulnTimer: 0,
      feverGauge: 0, // 0 to 100
      isFever: false,
      feverDuration: 8.0,
      feverTimer: 0,
      whiffRecoveryTimer: 0,
    };

    // Attack variety rotation
    this.attackCycle = 0;

    // Combat Stats for Current Stream
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectHits = 0;
    this.greatHits = 0;
    this.totalHits = 0;
    this.whiffs = 0;
    this.enemiesDefeated = 0;

    // Game Mode: 'career' | 'endless'
    this.gameMode = 'career';
    this.currentTrackIndex = 0;
    this.gameState = 'menu'; // 'menu' | 'playing' | 'paused' | 'gameover' | 'victory'

    // Wave Progression
    this.wave = 1;
    this.maxWaves = 3;
    this.waveTimer = 0;
    this.enemiesInWave = 0;
    this.enemiesSpawned = 0;
    this.waveSpawnInterval = 1.0;
    this.lastSpawnTime = 0;
    this.isBossWave = false;
    this.bossEnemy = null;

    // Timing & Beat
    this.lastTime = 0;
    this.beatPulse = 0;
    this.beatNumber = 0;

    // Callbacks for UI updates
    this.onHudUpdate = null;
    this.onGameOver = null;
    this.onVictory = null;

    // Bindings
    this.loop = this.loop.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleBeat = this.handleBeat.bind(this);

    this.audio.onBeat = this.handleBeat;

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    // Dynamic strike range based on screen width
    const baseRange = Math.min(220, Math.max(140, this.width * 0.16));
    const weaponData = this.shop.getSelectedWeaponData();
    this.enemyManager.setStrikeRange(baseRange * weaponData.rangeMultiplier);
  }

  handleBeat(beatNum, time) {
    this.beatPulse = 1.0;
    this.beatNumber = beatNum;
  }

  // =========================================================================
  // GAME FLOW CONTROLS
  // =========================================================================

  startStream(mode = 'career', trackIndex = 0) {
    this.gameMode = mode;
    this.currentTrackIndex = trackIndex;
    this.gameState = 'playing';

    // Reset Player
    this.player.hp = 3;
    this.player.maxHp = 3;
    this.player.invulnTimer = 0;
    this.player.feverGauge = 0;
    this.player.isFever = false;
    this.player.state = 'idle';
    this.player.animProgress = 0;
    this.player.whiffRecoveryTimer = 0;

    // Reset Combat Stats
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectHits = 0;
    this.greatHits = 0;
    this.totalHits = 0;
    this.whiffs = 0;
    this.enemiesDefeated = 0;

    // Reset Systems
    this.enemyManager.reset();
    this.particles.reset();
    this.streamer.reset();

    // Configure Range with current weapon
    const weaponData = this.shop.getSelectedWeaponData();
    const baseRange = Math.min(220, Math.max(140, this.width * 0.16));
    this.enemyManager.setStrikeRange(baseRange * weaponData.rangeMultiplier);

    // Setup Wave progression
    this.wave = 1;
    this.isBossWave = false;
    this.bossEnemy = null;
    this.setupWave(this.wave);

    // Start Track
    this.audio.playTrack(this.currentTrackIndex);
    this.lastTime = performance.now();

    requestAnimationFrame(this.loop);
  }

  setupWave(waveNumber) {
    this.wave = waveNumber;
    this.enemiesSpawned = 0;
    this.lastSpawnTime = 0;

    if (this.gameMode === 'career') {
      if (waveNumber === 1) {
        this.enemiesInWave = 14;
        this.waveSpawnInterval = Math.max(0.7, 60 / this.audio.bpm * 2);
        this.isBossWave = false;
      } else if (waveNumber === 2) {
        this.enemiesInWave = 22;
        this.waveSpawnInterval = Math.max(0.55, 60 / this.audio.bpm * 1.5);
        this.isBossWave = false;
      } else if (waveNumber === 3) {
        // Boss Wave!
        this.enemiesInWave = 10;
        this.waveSpawnInterval = Math.max(0.6, 60 / this.audio.bpm * 1.5);
        this.isBossWave = true;
      }
    } else {
      // Endless mode scales indefinitely
      this.enemiesInWave = 20 + waveNumber * 5;
      const speedScale = Math.min(1.7, 1.0 + waveNumber * 0.08);
      this.enemyManager.difficultyMultiplier = speedScale;
      this.waveSpawnInterval = Math.max(0.38, (60 / this.audio.bpm * 1.8) / speedScale);
      this.isBossWave = waveNumber % 3 === 0;
    }

    this.particles.addFloatingText(`WAVE ${waveNumber}`, 0, -120, '#00ffcc', 32, 'bold');
  }

  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.audio.stopTrack();
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.audio.playTrack(this.currentTrackIndex);
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop);
    }
  }

  // =========================================================================
  // INPUT HANDLING (2-KEY CORE)
  // =========================================================================

  handleAttack(side) {
    // side: 'left' | 'right'
    if (this.gameState !== 'playing') return;

    // Check whiff recovery lock
    if (this.player.whiffRecoveryTimer > 0) {
      return;
    }

    const enemy = this.enemyManager.getClosestEnemy(side);
    const weaponData = this.shop.getSelectedWeaponData();

    if (enemy && enemy.inStrikeRange) {
      // HIT REGISTERED!
      this.processHit(side, enemy, weaponData);
    } else {
      // MISS / WHIFF!
      this.processWhiff(side);
    }
  }

  processHit(side, enemy, weaponData) {
    const isPerfect = enemy.inPerfectRange || this.player.isFever;
    const facing = side === 'left' ? -1 : 1;
    this.player.facing = facing;

    // Attack choreography rotation
    this.attackCycle = (this.attackCycle + 1) % 4;
    let attackType = 'punch';
    const weapon = this.save.data.selectedWeapon;

    if (weapon === 'katana') attackType = 'katana';
    else if (weapon === 'nunchaku') attackType = 'nunchaku';
    else if (weapon === 'staff') attackType = 'staff';
    else if (weapon === 'sabers') attackType = 'katana';
    else {
      // Bare knuckles dynamic moves
      if (this.attackCycle === 0) attackType = 'punch';
      else if (this.attackCycle === 1) attackType = 'kick';
      else if (this.attackCycle === 2) attackType = 'uppercut';
      else attackType = 'punch';
    }

    this.player.state = attackType;
    this.player.animProgress = 0;
    this.player.animTimer = 0.16;

    // Combat mechanics
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    this.totalHits++;

    // Timing score
    const basePts = isPerfect ? 500 : 250;
    const comboMultiplier = 1.0 + Math.min(4.0, this.combo * 0.05);
    const scoreAdd = Math.round(basePts * comboMultiplier * weaponData.scoreMultiplier * (this.player.isFever ? 2.5 : 1.0));
    this.score += scoreAdd;

    // Visuals & Sound
    const impactX = enemy.x;
    const impactY = enemy.y - (enemy.scale * 45);

    if (isPerfect) {
      this.perfectHits++;
      this.audio.playPerfectChime();
      this.particles.createHitSparks(impactX, impactY, '#00ffcc', 20, true);
      this.particles.createShockwave(impactX, impactY, 90, 'rgba(0, 255, 204, 0.7)');
      this.particles.addFloatingText('PERFECT!', impactX, impactY - 30, '#00ffcc', 22, 'bold');
      this.player.feverGauge = Math.min(100, this.player.feverGauge + 10);
    } else {
      this.greatHits++;
      this.particles.createHitSparks(impactX, impactY, '#ffea00', 12, false);
      this.particles.addFloatingText('GREAT!', impactX, impactY - 25, '#ffea00', 18, 'bold');
      this.player.feverGauge = Math.min(100, this.player.feverGauge + 5);
    }

    // Play weapon / punch SFX
    if (weapon === 'katana' || weapon === 'sabers') {
      this.audio.playSlash();
      this.particles.createSlashTrail(0, -50, impactX, impactY, '#00ffff', 9);
    } else if (weapon === 'staff') {
      this.audio.playStaffHit();
    } else if (weapon === 'nunchaku') {
      this.audio.playNunchakuSpin();
    } else {
      this.audio.playPunch(this.attackCycle === 2, isPerfect);
    }

    this.audio.playComboChime(this.combo);

    // Hit-stop & screen trauma
    this.particles.triggerHitStop(isPerfect ? 3 : 2);
    this.particles.addShake(isPerfect ? 9 : 5, 0.18);

    // Hit enemy in manager
    const result = this.enemyManager.hitEnemy(enemy, this.player.isFever, side);

    if (result.isKilled) {
      this.enemiesDefeated++;
      this.particles.createDisintegration(impactX, impactY, enemy.color, 24);

      if (enemy.type === 'boss') {
        this.streamer.triggerEvent('boss_defeated');
        this.particles.addShake(18, 0.4);
        this.particles.createShockwave(impactX, impactY, 200, '#ff0055');
        this.particles.addFloatingText('BOSS ELIMINATED!!', 0, -100, '#ffd700', 36, 'bold');
      }
    }

    // Streamer live reactions
    this.streamer.triggerEvent('combo', { combo: this.combo });
  }

  processWhiff(side) {
    this.player.facing = side === 'left' ? -1 : 1;
    this.player.state = 'whiff';
    this.player.animProgress = 0;
    this.player.whiffRecoveryTimer = 0.22; // Brief punishment recovery
    this.player.animTimer = 0.22;

    this.combo = 0;
    this.whiffs++;
    this.audio.playMiss();
    this.particles.addShake(3, 0.1);
    this.particles.addFloatingText('MISS!', this.player.facing * 40, -60, '#ff3366', 20, 'bold');

    this.streamer.triggerEvent('miss');
  }

  triggerFever() {
    if (this.player.feverGauge < 100 || this.player.isFever) return;

    this.player.isFever = true;
    this.player.feverTimer = this.player.feverDuration;
    this.player.feverGauge = 100;

    this.audio.playFeverActivate();
    this.particles.addShake(16, 0.4);
    this.particles.createShockwave(0, -50, 250, 'rgba(255, 215, 0, 0.9)');
    this.particles.addFloatingText('MAXIMUM OVERDRIVE!!', 0, -110, '#ffd700', 34, 'bold');

    this.streamer.triggerEvent('fever');
  }

  // =========================================================================
  // UPDATE LOOP
  // =========================================================================

  update(dt) {
    // Beat pulse decay
    this.beatPulse = Math.max(0, this.beatPulse - dt * 4.0);

    // Update Visual Juice & Particles
    const isHitStop = this.particles.update(dt);
    if (isHitStop) {
      // Freeze frame active
      return;
    }

    // Update Streamer live chat & viewer counts
    this.streamer.update(dt);

    // Player Fever decay
    if (this.player.isFever) {
      this.player.feverTimer -= dt;
      this.player.feverGauge = (this.player.feverTimer / this.player.feverDuration) * 100;
      if (this.player.feverTimer <= 0) {
        this.player.isFever = false;
        this.player.feverGauge = 0;
      }
    }

    // Player recovery timer
    if (this.player.whiffRecoveryTimer > 0) {
      this.player.whiffRecoveryTimer -= dt;
      if (this.player.whiffRecoveryTimer <= 0) {
        this.player.state = 'idle';
      }
    }

    // Player animation progress
    if (this.player.animTimer > 0) {
      this.player.animTimer -= dt;
      this.player.animProgress = 1.0 - (this.player.animTimer / this.player.animDuration);
      if (this.player.animTimer <= 0) {
        this.player.state = 'idle';
        this.player.animProgress = 0;
      }
    }

    // Player invulnerability timer
    if (this.player.invulnTimer > 0) {
      this.player.invulnTimer -= dt;
    }

    // Enemy Spawning Logic
    this.handleEnemySpawning(dt);

    // Update Enemies & collision check with player
    this.enemyManager.update(dt, 0, (enemy) => {
      // Player hit by enemy!
      if (this.player.invulnTimer <= 0 && !this.player.isFever) {
        this.player.hp--;
        this.player.invulnTimer = 1.2;
        this.player.state = 'hurt';
        this.player.animTimer = 0.25;
        this.combo = 0;

        this.audio.playHurt();
        this.particles.addShake(14, 0.25);
        this.particles.createHitSparks(0, -50, '#ff0033', 18, true);
        this.particles.addFloatingText('-1 HEART', 0, -70, '#ff0033', 24, 'bold');
        this.streamer.triggerEvent('miss');

        if (this.player.hp <= 0) {
          this.handleGameOver();
        }
      }
    });

    // Check wave completion in career mode
    if (this.gameMode === 'career') {
      if (this.enemiesSpawned >= this.enemiesInWave && this.enemyManager.enemies.length === 0) {
        if (this.wave < this.maxWaves) {
          this.setupWave(this.wave + 1);
        } else {
          this.handleVictory();
        }
      }
    } else {
      // Endless mode next wave
      if (this.enemiesSpawned >= this.enemiesInWave && this.enemyManager.enemies.length === 0) {
        this.setupWave(this.wave + 1);
      }
    }

    // Trigger HUD callback
    if (this.onHudUpdate) {
      this.onHudUpdate({
        score: this.score,
        combo: this.combo,
        maxCombo: this.maxCombo,
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        feverGauge: this.player.feverGauge,
        isFever: this.player.isFever,
        viewers: Math.round(this.streamer.viewers),
        likes: this.streamer.streamLikes,
        coins: this.streamer.streamCoins,
        wave: this.wave,
      });
    }
  }

  handleEnemySpawning(dt) {
    this.waveTimer += dt;
    if (this.waveTimer - this.lastSpawnTime >= this.waveSpawnInterval && this.enemiesSpawned < this.enemiesInWave) {
      this.lastSpawnTime = this.waveTimer;
      this.enemiesSpawned++;

      // Decide spawn side: Left (-1) or Right (1)
      const side = Math.random() > 0.5 ? 1 : -1;

      // Decide enemy type
      let type = 'grunt';
      if (this.isBossWave && this.enemiesSpawned === this.enemiesInWave) {
        type = 'boss';
        this.streamer.triggerEvent('boss_spawn');
      } else {
        const roll = Math.random();
        if (roll < 0.25 && this.wave >= 2) {
          type = 'brawler'; // Armored multi-hit
        } else if (roll < 0.45 && this.wave >= 2) {
          type = 'ninja'; // Acrobat
        } else if (roll < 0.7) {
          type = 'rusher'; // Fast cyan sprinter
        }
      }

      this.enemyManager.spawnEnemy(side, type, this.width);
    }
  }

  handleGameOver() {
    this.gameState = 'gameover';
    this.audio.stopTrack();

    const summary = this.streamer.calculateStreamSummary(
      this.score,
      this.maxCombo,
      this.perfectHits,
      this.totalHits
    );

    // Save stats
    this.save.addCoins(summary.coinsEarned);
    this.save.addSubscribers(summary.subscribersGained);
    this.save.updateStats(this.enemiesDefeated, this.maxCombo);

    if (this.gameMode === 'endless') {
      this.save.recordEndlessScore(this.score);
    }

    if (this.onGameOver) {
      this.onGameOver(summary);
    }
  }

  handleVictory() {
    this.gameState = 'victory';
    this.audio.stopTrack();
    this.audio.playVictory();

    const summary = this.streamer.calculateStreamSummary(
      this.score,
      this.maxCombo,
      this.perfectHits,
      this.totalHits
    );

    // Calculate stars (1 to 3)
    let stars = 1;
    if (summary.accuracyPct >= 80 && this.maxCombo >= 25) stars = 3;
    else if (summary.accuracyPct >= 60 || this.maxCombo >= 15) stars = 2;

    const trackId = `track${this.currentTrackIndex + 1}`;
    this.save.recordLevelScore(trackId, this.score, stars);
    this.save.addCoins(summary.coinsEarned + 200); // Victory bonus
    this.save.addSubscribers(summary.subscribersGained + 500);
    this.save.updateStats(this.enemiesDefeated, this.maxCombo);

    if (this.onVictory) {
      this.onVictory({ ...summary, stars });
    }
  }

  // =========================================================================
  // RENDER LOOP
  // =========================================================================

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake offset
    if (this.particles.screenShake > 0) {
      const shakeMag = this.particles.screenShake;
      const ox = (Math.random() - 0.5) * shakeMag * 2;
      const oy = (Math.random() - 0.5) * shakeMag * 2;
      ctx.translate(ox, oy);
    }

    // 1. Draw dynamic background theme
    this.drawBackground(ctx);

    // 2. Set world origin at bottom-center stage floor
    const groundY = this.height * 0.75;
    ctx.translate(this.width / 2, groundY);

    // 3. Draw Strike Range Indicators on floor
    this.drawStrikeRangeIndicators(ctx);

    // 4. Render enemies (both flying ragdolls and active)
    this.enemyManager.render(ctx, this.stickmanRenderer, this.beatPulse);

    // 5. Render Player Stickman
    const isBlinking = this.player.invulnTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;
    if (!isBlinking) {
      const selectedWeapon = this.save.data.selectedWeapon;
      const selectedHeadgear = this.save.data.selectedHeadgear;

      this.stickmanRenderer.drawStickman(ctx, {
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
        scale: 1.15,
        state: this.player.state,
        animProgress: this.player.animProgress,
        color: this.player.isFever ? '#ffd700' : '#ffffff',
        glowColor: this.player.isFever ? '#ffea00' : '#00e5ff',
        headgear: selectedHeadgear,
        weapon: selectedWeapon,
        isPlayer: true,
        isFever: this.player.isFever,
        beatPulse: this.beatPulse,
      });
    }

    // 6. Render Particles & Floating Combat feedback
    this.particles.render(ctx);

    ctx.restore();
  }

  // Draw background themes with dynamic equalizer bars & cyber perspective
  drawBackground(ctx) {
    const theme = this.save.data.selectedTheme || 'cyber_dojo';
    const audioData = this.audio.getAudioData();

    // Base background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    if (theme === 'shinjuku') {
      bgGrad.addColorStop(0, '#0a0a1a');
      bgGrad.addColorStop(0.65, '#141432');
      bgGrad.addColorStop(1, '#050510');
    } else if (theme === 'synthwave') {
      bgGrad.addColorStop(0, '#1a0033');
      bgGrad.addColorStop(0.6, '#3b0066');
      bgGrad.addColorStop(1, '#0d001a');
    } else if (theme === 'matrix') {
      bgGrad.addColorStop(0, '#001a05');
      bgGrad.addColorStop(0.65, '#002b0c');
      bgGrad.addColorStop(1, '#000d02');
    } else {
      // cyber_dojo default
      bgGrad.addColorStop(0, '#070b19');
      bgGrad.addColorStop(0.65, '#0f172a');
      bgGrad.addColorStop(1, '#05070f');
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Bass-reactive lighting flash on drops
    if (audioData.bass > 0.4) {
      ctx.fillStyle = `rgba(0, 229, 255, ${audioData.bass * 0.12})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Audio Equalizer visualizer bars in background
    if (audioData.raw && audioData.raw.length > 0) {
      const barCount = 28;
      const barWidth = this.width / barCount;
      const groundY = this.height * 0.75;

      for (let i = 0; i < barCount; i++) {
        const val = (audioData.raw[i % audioData.raw.length] || 0) / 255;
        const barHeight = val * (this.height * 0.28);
        const x = i * barWidth;
        const y = groundY - barHeight;

        ctx.fillStyle = `rgba(0, 255, 204, ${0.08 + val * 0.18})`;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      }
    }

    // Ground floor perspective grid
    const floorY = this.height * 0.75;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.25)';
    ctx.lineWidth = 1.5;

    // Horizon line
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(this.width, floorY);
    ctx.stroke();

    // Perspective floor lines radiating from center
    const centerX = this.width / 2;
    for (let x = -this.width; x <= this.width * 2; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, this.height);
      ctx.lineTo(centerX + (x - centerX) * 0.2, floorY);
      ctx.stroke();
    }

    // Horizontal floor grid lines
    for (let y = floorY; y <= this.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draw strike zone bars to guide 2-key rhythm timing
  drawStrikeRangeIndicators(ctx) {
    const range = this.enemyManager.strikeRange;
    const isFever = this.player.isFever;
    const color = isFever ? '#ffd700' : '#00e5ff';

    ctx.save();

    // Left range bracket
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Left strike bar on ground
    ctx.beginPath();
    ctx.moveTo(-range, -12);
    ctx.lineTo(-range, 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-range, 0);
    ctx.lineTo(-30, 0);
    ctx.stroke();

    // Right strike bar on ground
    ctx.beginPath();
    ctx.moveTo(range, -12);
    ctx.lineTo(range, 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(range, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();

    // Center player anchor ring
    ctx.strokeStyle = isFever ? '#ffd700' : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28 + this.beatPulse * 6, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  loop(currentTime) {
    if (this.gameState !== 'playing') return;

    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  }
}
