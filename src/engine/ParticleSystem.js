// ============================================================================
// PARTICLE & COMBAT VISUAL JUICE SYSTEM
// High-FPS sparks, slashes, shockwaves, floating text, and ragdoll debris
// ============================================================================

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.slashTrails = [];
    this.screenShake = 0;
    this.screenShakeDuration = 0;
    this.hitStopFrames = 0;
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.slashTrails = [];
    this.screenShake = 0;
    this.screenShakeDuration = 0;
    this.hitStopFrames = 0;
  }

  // Camera trauma trigger
  addShake(intensity = 8, duration = 0.2) {
    this.screenShake = Math.max(this.screenShake, intensity);
    this.screenShakeDuration = Math.max(this.screenShakeDuration, duration);
  }

  triggerHitStop(frames = 3) {
    this.hitStopFrames = Math.max(this.hitStopFrames, frames);
  }

  // Hit impact sparks
  createHitSparks(x, y, color = '#00ffcc', count = 16, isHeavy = false) {
    const num = isHeavy ? count * 1.5 : count;
    for (let i = 0; i < num; i++) {
      const angle = (Math.PI * 2 * i) / num + (Math.random() - 0.5) * 0.5;
      const speed = (isHeavy ? 400 : 250) * (0.5 + Math.random() * 0.8);
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3.5 + 2,
        life: 1.0,
        decay: Math.random() * 2.5 + 2.5,
        gravity: 280,
      });
    }
  }

  // Stickman disintegration into cyber fragments
  createDisintegration(x, y, color = '#ff0055', count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 320 + 80;
      this.particles.push({
        type: 'cube',
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        color,
        size: Math.random() * 5 + 3,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
        life: 1.0,
        decay: Math.random() * 1.8 + 1.2,
        gravity: 380,
      });
    }
  }

  // Slash arc trail
  createSlashTrail(x1, y1, x2, y2, color = '#00ffff', width = 8) {
    this.slashTrails.push({
      x1, y1, x2, y2,
      color,
      width,
      life: 1.0,
      decay: 6.0, // Fades quickly for snappy feel
    });
  }

  // Shockwave ring
  createShockwave(x, y, maxRadius = 120, color = 'rgba(0, 255, 204, 0.8)', duration = 0.3) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      color,
      life: 1.0,
      decay: 1 / duration,
      strokeWidth: 6,
    });
  }

  // Floating combat feedback text
  addFloatingText(text, x, y, color = '#ffffff', fontSize = 24, fontStyle = 'bold') {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      fontSize,
      fontStyle,
      scale: 1.4, // Pops in large then scales to 1.0
      targetScale: 1.0,
      vy: -140, // Floats upward
      life: 1.0,
      decay: 1.6,
    });
  }

  update(dt) {
    // Screen shake decay
    if (this.screenShakeDuration > 0) {
      this.screenShakeDuration -= dt;
      if (this.screenShakeDuration <= 0) {
        this.screenShake = 0;
      }
    }

    // Hit-stop frames check
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      return true; // Indicates hitstop is active
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      if (p.vRot) p.rotation += p.vRot * dt;
    }

    // Update floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= ft.decay * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
      ft.vy *= 0.94; // Decelerate upward float
      if (ft.scale > ft.targetScale) {
        ft.scale -= (ft.scale - ft.targetScale) * 12 * dt;
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= sw.decay * dt;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      sw.radius += (sw.maxRadius - sw.radius) * 14 * dt;
    }

    // Update slash trails
    for (let i = this.slashTrails.length - 1; i >= 0; i--) {
      const st = this.slashTrails[i];
      st.life -= st.decay * dt;
      if (st.life <= 0) {
        this.slashTrails.splice(i, 1);
      }
    }

    return false;
  }

  // Draw screen effects and particles
  render(ctx) {
    ctx.save();

    // 1. Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.life;
      ctx.lineWidth = sw.strokeWidth * sw.life;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Slash trails
    for (const st of this.slashTrails) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(st.x1, st.y1);
      ctx.lineTo(st.x2, st.y2);
      ctx.strokeStyle = st.color;
      ctx.globalAlpha = st.life;
      ctx.lineWidth = st.width * st.life;
      ctx.lineCap = 'round';
      ctx.shadowColor = st.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.type === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'cube') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        const s = p.size * p.life;
        ctx.fillRect(-s / 2, -s / 2, s, s);
      }
      ctx.restore();
    }

    // 4. Floating texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, ft.life * 1.5);
      ctx.font = `${ft.fontStyle} ${Math.round(ft.fontSize * ft.scale)}px 'Outfit', 'Inter', 'Segoe UI', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text glow outline
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.strokeText(ft.text, ft.x, ft.y);

      // Main fill
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
