// ============================================================================
// ENEMY MANAGER & WAVE SPAWNING
// Rhythm-synchronized enemy waves, multiple archetypes, multi-hit combos
// ============================================================================

export class EnemyManager {
  constructor() {
    this.enemies = [];
    this.deadEnemies = []; // Ragdoll flying bodies
    this.spawnTimer = 0;
    this.difficultyMultiplier = 1.0;
    this.baseSpeed = 240;
    this.strikeRange = 160;
    this.perfectRange = 90; // Close to player for maximum timing score
  }

  reset() {
    this.enemies = [];
    this.deadEnemies = [];
    this.spawnTimer = 0;
  }

  setStrikeRange(range) {
    this.strikeRange = range;
    this.perfectRange = range * 0.6;
  }

  // Spawn an enemy
  // side: -1 (left), 1 (right)
  // type: 'grunt' | 'rusher' | 'brawler' | 'ninja' | 'boss'
  spawnEnemy(side, type = 'grunt', screenWidth = 1000) {
    const startDistance = (screenWidth / 2) + Math.random() * 80 + 40;
    const x = side * startDistance;

    let hp = 1;
    let sequence = [side === -1 ? 'left' : 'right'];
    let speed = this.baseSpeed * this.difficultyMultiplier;
    let color = '#ff2255'; // Red
    let scale = 1.0;
    let headgear = 'none';

    if (type === 'rusher') {
      speed = this.baseSpeed * 1.55 * this.difficultyMultiplier;
      color = '#00e5ff'; // Cyan
      hp = 1;
    } else if (type === 'brawler') {
      // 2 hits: e.g. same side twice, or alternate
      const alternate = Math.random() > 0.5;
      sequence = [
        side === -1 ? 'left' : 'right',
        alternate ? (side === -1 ? 'right' : 'left') : (side === -1 ? 'left' : 'right')
      ];
      hp = 2;
      speed = this.baseSpeed * 0.85 * this.difficultyMultiplier;
      color = '#ff9900'; // Orange
      scale = 1.25;
      headgear = 'horns';
    } else if (type === 'ninja') {
      // 2-hit acrobat: jumps to opposite side on 1st hit
      sequence = [side === -1 ? 'left' : 'right', side === -1 ? 'right' : 'left'];
      hp = 2;
      speed = this.baseSpeed * 1.2 * this.difficultyMultiplier;
      color = '#cc00ff'; // Purple
      headgear = 'visor';
    } else if (type === 'boss') {
      // Boss Stickman: 5-hit rhythmic sequence
      hp = 5;
      speed = this.baseSpeed * 0.65;
      color = '#ff0033';
      scale = 1.45;
      headgear = 'hair';
      const s1 = side === -1 ? 'left' : 'right';
      const s2 = s1 === 'left' ? 'right' : 'left';
      sequence = [s1, s2, s1, s1, s2];
    }

    const enemy = {
      id: Math.random().toString(36).substr(2, 9),
      side, // -1 or 1
      x,
      y: 0,
      type,
      hp,
      maxHp: hp,
      sequence,
      currentStep: 0,
      speed,
      color,
      scale,
      headgear,
      state: 'idle',
      animProgress: 0,
      facing: side === -1 ? 1 : -1, // Facing player at center (0,0)
      staggerTimer: 0,
      inStrikeRange: false,
      inPerfectRange: false,
    };

    this.enemies.push(enemy);
    return enemy;
  }

  // Find closest enemy on a given side ('left' or 'right')
  getClosestEnemy(side) {
    const sign = side === 'left' ? -1 : 1;
    let closest = null;
    let minDist = Infinity;

    for (const e of this.enemies) {
      // Enemy must be on the specified side
      if ((sign === -1 && e.x < 0) || (sign === 1 && e.x > 0)) {
        const dist = Math.abs(e.x);
        if (dist < minDist) {
          minDist = dist;
          closest = e;
        }
      }
    }

    return closest;
  }

  // Hit the enemy
  hitEnemy(enemy, isFever = false, hitDirection = 'left') {
    if (isFever) {
      // Fever kills immediately regardless of HP!
      enemy.hp = 0;
    } else {
      enemy.hp--;
      enemy.currentStep++;
    }

    if (enemy.hp <= 0) {
      // Dead: remove from active enemies and convert to ragdoll projectile
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
      }

      const launchDir = hitDirection === 'left' ? -1 : 1;
      const launchSpeed = 650 + Math.random() * 250;
      this.deadEnemies.push({
        x: enemy.x,
        y: enemy.y,
        vx: launchDir * launchSpeed,
        vy: -350 - Math.random() * 200,
        rot: 0,
        vrot: launchDir * (8 + Math.random() * 12),
        color: enemy.color,
        scale: enemy.scale,
        headgear: enemy.headgear,
        life: 1.0,
        decay: 1.8,
        facing: enemy.facing,
      });

      return { isKilled: true, enemy };
    } else {
      // Enemy staggered back
      enemy.staggerTimer = 0.22;

      // If ninja acrobat, leap over player to opposite side!
      if (enemy.type === 'ninja') {
        enemy.x = -enemy.x;
        enemy.side = enemy.x < 0 ? -1 : 1;
        enemy.facing = enemy.side === -1 ? 1 : -1;
      } else if (enemy.type === 'boss') {
        // Boss positions to the side needed for the next rhythm sequence hit!
        const nextReq = enemy.sequence[enemy.currentStep];
        const nextSide = nextReq === 'left' ? -1 : 1;
        enemy.x = nextSide * (this.strikeRange * 0.55);
        enemy.side = nextSide;
        enemy.facing = enemy.side === -1 ? 1 : -1;
      } else {
        // Armored brawler knockback
        const knockback = hitDirection === 'left' ? -50 : 50;
        enemy.x += knockback;
      }

      return { isKilled: false, enemy };
    }
  }

  update(dt, playerX = 0, onPlayerHit = null) {
    // 1. Update active enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Stagger recovery
      if (e.staggerTimer > 0) {
        e.staggerTimer -= dt;
        continue;
      }

      // Move toward player at center (0, 0)
      const dist = Math.abs(e.x);
      const moveAmount = e.speed * dt;

      if (e.x < 0) {
        e.x += moveAmount;
        if (e.x > 0) e.x = 0;
      } else {
        e.x -= moveAmount;
        if (e.x < 0) e.x = 0;
      }

      // Update strike range status
      e.inStrikeRange = dist <= this.strikeRange;
      e.inPerfectRange = dist <= this.perfectRange && dist >= 20;

      // Check if enemy reached player!
      if (dist <= 18) {
        // Player takes damage!
        if (onPlayerHit) {
          onPlayerHit(e);
        }
        // Remove enemy after dealing damage
        this.enemies.splice(i, 1);
      }
    }

    // 2. Update ragdoll dead enemies flying away
    for (let i = this.deadEnemies.length - 1; i >= 0; i--) {
      const de = this.deadEnemies[i];
      de.life -= de.decay * dt;
      if (de.life <= 0) {
        this.deadEnemies.splice(i, 1);
        continue;
      }

      de.x += de.vx * dt;
      de.y += de.vy * dt;
      de.vy += 850 * dt; // Gravity
      de.rot += de.vrot * dt;
    }
  }

  render(ctx, stickmanRenderer, beatPulse) {
    // Render dead flying ragdolls first
    for (const de of this.deadEnemies) {
      stickmanRenderer.drawStickman(ctx, {
        x: de.x,
        y: de.y,
        facing: de.facing,
        scale: de.scale,
        color: de.color,
        headgear: de.headgear,
        state: 'hurt',
        animProgress: 1.0,
        ragdoll: { rot: de.rot },
      });
    }

    // Render active enemies
    for (const e of this.enemies) {
      // Draw rhythm combo dots above multi-hit enemies
      if (e.maxHp > 1) {
        this.drawEnemyNodes(ctx, e);
      }

      // Draw stickman
      stickmanRenderer.drawStickman(ctx, {
        x: e.x,
        y: e.y,
        facing: e.facing,
        scale: e.scale,
        color: e.color,
        headgear: e.headgear,
        state: e.staggerTimer > 0 ? 'hurt' : 'idle',
        animProgress: 0,
        beatPulse,
      });

      // Target indicator under enemy if inside strike range
      if (e.inStrikeRange) {
        this.drawTargetIndicator(ctx, e);
      }
    }
  }

  // Draw rhythm sequence requirement dots above armored stickmen
  drawEnemyNodes(ctx, enemy) {
    ctx.save();
    const nodeCount = enemy.sequence.length;
    const startX = enemy.x - ((nodeCount - 1) * 16) / 2;
    const nodeY = enemy.y - (enemy.scale * 95);

    for (let i = 0; i < nodeCount; i++) {
      const nx = startX + i * 16;
      const isCompleted = i < enemy.currentStep;
      const req = enemy.sequence[i]; // 'left' or 'right'

      ctx.save();
      ctx.beginPath();
      ctx.arc(nx, nodeY, isCompleted ? 4 : 7, 0, Math.PI * 2);

      if (isCompleted) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      } else {
        ctx.fillStyle = req === 'left' ? '#00e5ff' : '#ff00aa';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fill();

        // Direction arrow inside dot
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(req === 'left' ? '◄' : '►', nx, nodeY);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // Glowing indicator under enemy when strikeable
  drawTargetIndicator(ctx, enemy) {
    ctx.save();
    const isPerfect = enemy.inPerfectRange;
    ctx.strokeStyle = isPerfect ? '#00ffcc' : '#ffea00';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = isPerfect ? 15 : 8;
    ctx.lineWidth = 2.5;

    // Glowing chevron or circle under feet
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 4, 18, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Small chevron pointing up
    ctx.beginPath();
    ctx.moveTo(enemy.x - 6, enemy.y + 14);
    ctx.lineTo(enemy.x, enemy.y + 8);
    ctx.lineTo(enemy.x + 6, enemy.y + 14);
    ctx.stroke();

    ctx.restore();
  }
}
