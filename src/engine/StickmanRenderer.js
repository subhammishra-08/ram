// ============================================================================
// STICKMAN RIGGING & PROCEDURAL ANIMATION ENGINE
// Kinematic bone hierarchy, weapons, accessories, and fluid dynamic stances
// ============================================================================

export class StickmanRenderer {
  constructor() {
    this.time = 0;
  }

  // Draw a complete stickman character
  // config: {
  //   x, y, facing (1 or -1), scale,
  //   state: 'idle'|'punch'|'kick'|'uppercut'|'katana'|'nunchaku'|'staff'|'whiff'|'hurt'|'fever',
  //   animProgress: 0.0 to 1.0,
  //   color: '#00ffcc',
  //   headgear: 'none'|'headband'|'visor'|'headset'|'hair'|'horns',
  //   weapon: 'fists'|'katana'|'nunchaku'|'staff'|'sabers',
  //   isPlayer: boolean,
  //   isFever: boolean,
  //   beatPulse: 0.0 to 1.0,
  //   ragdoll: { vx, vy, rot, vrot } (optional)
  // }
  drawStickman(ctx, config) {
    ctx.save();
    ctx.translate(config.x, config.y);

    const facing = config.facing || 1;
    const scale = config.scale || 1.0;
    ctx.scale(facing * scale, scale);

    if (config.ragdoll) {
      ctx.rotate(config.ragdoll.rot || 0);
    }

    const state = config.state || 'idle';
    const progress = Math.max(0, Math.min(1, config.animProgress || 0));
    const isFever = !!config.isFever;
    const mainColor = isFever ? '#ffd700' : (config.color || '#ffffff');
    const glowColor = isFever ? '#ffaa00' : (config.glowColor || mainColor);

    // Compute joint coordinates based on animation state
    const pose = this.calculatePose(state, progress, config.beatPulse || 0, isFever);

    // Aura effect for Fever mode
    if (isFever) {
      this.drawAura(ctx, pose, glowColor);
    }

    // Shadow on floor if near ground
    if (!config.ragdoll && Math.abs(config.y) < 1000) {
      this.drawShadow(ctx, pose);
    }

    // Set line aesthetics
    ctx.strokeStyle = mainColor;
    ctx.fillStyle = mainColor;
    ctx.lineWidth = 4.5 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isFever ? 20 : 10;

    // Draw back limbs
    this.drawLimb(ctx, pose.hip, pose.backKnee, pose.backFoot);
    this.drawLimb(ctx, pose.shoulder, pose.backElbow, pose.backHand);

    // Draw Spine & Torso
    ctx.beginPath();
    ctx.moveTo(pose.hip.x, pose.hip.y);
    ctx.lineTo(pose.shoulder.x, pose.shoulder.y);
    ctx.stroke();

    // Draw Head & Accessories
    this.drawHead(ctx, pose.head, config.headgear, mainColor, glowColor, facing, isFever);

    // Draw front limbs
    this.drawLimb(ctx, pose.hip, pose.frontKnee, pose.frontFoot);
    this.drawLimb(ctx, pose.shoulder, pose.frontElbow, pose.frontHand);

    // Draw Weapon if applicable
    if (config.weapon && config.weapon !== 'fists') {
      this.drawWeapon(ctx, config.weapon, pose, state, progress, glowColor);
    }

    ctx.restore();
  }

  calculatePose(state, p, beatPulse, isFever) {
    // Base bone points relative to ground (0, 0)
    // Standing height: head is at y ≈ -80
    const pose = {
      head: { x: 0, y: -74 },
      shoulder: { x: 0, y: -58 },
      hip: { x: 0, y: -36 },
      // Front arm
      frontElbow: { x: 8, y: -45 },
      frontHand: { x: 16, y: -38 },
      // Back arm
      backElbow: { x: -8, y: -45 },
      backHand: { x: -14, y: -36 },
      // Front leg
      frontKnee: { x: 6, y: -18 },
      frontFoot: { x: 10, y: 0 },
      // Back leg
      backKnee: { x: -8, y: -18 },
      backFoot: { x: -12, y: 0 },
    };

    if (state === 'idle') {
      // Bouncy rhythmic stance sync'd with music beatPulse
      const bounce = Math.sin(beatPulse * Math.PI) * 7;
      const sway = Math.cos(beatPulse * Math.PI * 2) * 2;

      pose.hip.y += bounce;
      pose.shoulder.y += bounce * 0.9;
      pose.head.y += bounce * 0.8;

      pose.hip.x += sway;
      pose.shoulder.x += sway * 0.6;

      // Knees bend on bounce
      pose.frontKnee.y = -18 + bounce * 0.5;
      pose.frontKnee.x = 8 + sway;
      pose.frontFoot.x = 12;

      pose.backKnee.y = -18 + bounce * 0.5;
      pose.backKnee.x = -8 - sway;
      pose.backFoot.x = -14;

      // Ready guard fists
      pose.frontElbow = { x: 10, y: -52 + bounce };
      pose.frontHand = { x: 18, y: -56 + bounce };
      pose.backElbow = { x: -6, y: -50 + bounce };
      pose.backHand = { x: 6, y: -58 + bounce };
    }
    else if (state === 'punch') {
      // Lightning straight jab
      const reach = Math.sin(p * Math.PI); // 0 -> 1 -> 0

      pose.hip.x += reach * 12;
      pose.shoulder.x += reach * 22;
      pose.head.x += reach * 16;

      // Lead arm explodes forward
      pose.frontElbow = { x: 22 + reach * 28, y: -56 };
      pose.frontHand = { x: 42 + reach * 36, y: -58 };

      // Back arm guards jaw
      pose.backElbow = { x: reach * 8, y: -48 };
      pose.backHand = { x: 10 + reach * 10, y: -58 };

      // Legs brace
      pose.frontFoot = { x: 20 + reach * 8, y: 0 };
      pose.backFoot = { x: -18, y: 0 };
    }
    else if (state === 'kick') {
      // Flying jump roundhouse / dragon kick
      const ext = Math.sin(p * Math.PI);

      pose.hip.y -= ext * 28;
      pose.shoulder.y -= ext * 24;
      pose.head.y -= ext * 20;

      pose.hip.x += ext * 18;
      pose.shoulder.x += ext * 12;

      // Front leg fully extended high kick
      pose.frontKnee = { x: 24 + ext * 26, y: -40 - ext * 14 };
      pose.frontFoot = { x: 50 + ext * 34, y: -48 - ext * 16 };

      // Back leg tucked
      pose.backKnee = { x: -10, y: -16 - ext * 20 };
      pose.backFoot = { x: -6, y: -6 - ext * 18 };

      // Balancing arms
      pose.frontElbow = { x: 8, y: -62 };
      pose.frontHand = { x: 16, y: -68 };
      pose.backElbow = { x: -24, y: -45 };
      pose.backHand = { x: -36, y: -38 };
    }
    else if (state === 'uppercut') {
      // Rising dragon punch
      const lift = Math.sin(p * Math.PI);

      pose.hip.y -= lift * 35;
      pose.shoulder.y -= lift * 42;
      pose.head.y -= lift * 44;
      pose.head.x += lift * 6;

      // Punching fist reaches straight up into the air
      pose.frontElbow = { x: 12 + lift * 6, y: -72 - lift * 30 };
      pose.frontHand = { x: 16 + lift * 8, y: -100 - lift * 40 };

      // Guard arm
      pose.backElbow = { x: -10, y: -50 - lift * 25 };
      pose.backHand = { x: 0, y: -58 - lift * 25 };

      // Trailing jump legs
      pose.frontKnee = { x: 8, y: -15 - lift * 25 };
      pose.frontFoot = { x: 10, y: 5 - lift * 20 };
      pose.backKnee = { x: -6, y: -10 - lift * 30 };
      pose.backFoot = { x: -10, y: 10 - lift * 24 };
    }
    else if (state === 'katana') {
      // Blinding dash slash
      const slash = Math.sin(p * Math.PI);

      pose.hip.x += slash * 25;
      pose.shoulder.x += slash * 32;
      pose.head.x += slash * 30;
      pose.head.y += 6; // Crouched dash

      // Both hands gripping forward katana arc
      pose.frontElbow = { x: 26 + slash * 20, y: -54 };
      pose.frontHand = { x: 44 + slash * 30, y: -50 };
      pose.backElbow = { x: 18 + slash * 18, y: -50 };
      pose.backHand = { x: 38 + slash * 28, y: -48 };

      // Deep sprint stance
      pose.frontKnee = { x: 26 + slash * 12, y: -14 };
      pose.frontFoot = { x: 34 + slash * 14, y: 0 };
      pose.backKnee = { x: -14, y: -10 };
      pose.backFoot = { x: -28, y: 0 };
    }
    else if (state === 'nunchaku') {
      // Dynamic twin weapon swing
      const spin = p * Math.PI * 4;

      pose.frontElbow = { x: 16, y: -54 };
      pose.frontHand = { x: 22 + Math.cos(spin) * 20, y: -54 + Math.sin(spin) * 20 };
      pose.backElbow = { x: -14, y: -50 };
      pose.backHand = { x: -18 + Math.cos(spin + Math.PI) * 16, y: -50 + Math.sin(spin + Math.PI) * 16 };
    }
    else if (state === 'staff') {
      // Bo staff vault smash
      const vault = Math.sin(p * Math.PI);

      pose.hip.y -= vault * 30;
      pose.shoulder.y -= vault * 28;
      pose.head.y -= vault * 25;

      pose.frontElbow = { x: 28, y: -55 - vault * 15 };
      pose.frontHand = { x: 36, y: -65 - vault * 20 };
      pose.backElbow = { x: 10, y: -40 - vault * 15 };
      pose.backHand = { x: 18, y: -48 - vault * 18 };
    }
    else if (state === 'whiff') {
      // Off balance stumble forward
      pose.shoulder.x += 16;
      pose.head.x += 20;
      pose.head.y += 6;

      pose.frontElbow = { x: 28, y: -38 };
      pose.frontHand = { x: 36, y: -24 };
      pose.backElbow = { x: -18, y: -60 };
      pose.backHand = { x: -26, y: -68 };

      pose.frontKnee = { x: 18, y: -12 };
      pose.frontFoot = { x: 24, y: 0 };
      pose.backKnee = { x: -12, y: -16 };
      pose.backFoot = { x: -18, y: 0 };
    }
    else if (state === 'hurt') {
      // Knockback recoil
      pose.hip.x -= 14;
      pose.shoulder.x -= 22;
      pose.head.x -= 26;
      pose.head.y -= 4; // Head tilted back

      pose.frontElbow = { x: 2, y: -60 };
      pose.frontHand = { x: 10, y: -72 };
      pose.backElbow = { x: -16, y: -54 };
      pose.backHand = { x: -26, y: -50 };

      pose.frontFoot = { x: 4, y: 0 };
      pose.backFoot = { x: -22, y: 0 };
    }

    return pose;
  }

  // Draw two-segment bone limb
  drawLimb(ctx, jointA, jointB, jointC) {
    ctx.beginPath();
    ctx.moveTo(jointA.x, jointA.y);
    ctx.lineTo(jointB.x, jointB.y);
    ctx.lineTo(jointC.x, jointC.y);
    ctx.stroke();
  }

  // Draw Head with customizable cosmetic accessories
  drawHead(ctx, headPos, headgear, mainColor, glowColor, facing, isFever) {
    const headRadius = 13;

    // Head circle
    ctx.beginPath();
    ctx.arc(headPos.x, headPos.y, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Accessories
    if (headgear === 'visor') {
      // Cyber Neon Visor
      ctx.save();
      ctx.strokeStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(headPos.x - 2, headPos.y - 1);
      ctx.lineTo(headPos.x + 13, headPos.y - 1);
      ctx.stroke();
      ctx.restore();
    }
    else if (headgear === 'headband') {
      // Ninja Red Bandana with waving ribbon tails
      ctx.save();
      ctx.strokeStyle = '#ff2255';
      ctx.shadowColor = '#ff2255';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, headRadius + 1, -Math.PI * 0.9, 0.1);
      ctx.stroke();

      // Ribbon tails fluttering behind
      const wave = Math.sin(Date.now() * 0.012) * 5;
      ctx.beginPath();
      ctx.moveTo(headPos.x - 12, headPos.y - 3);
      ctx.quadraticCurveTo(headPos.x - 24, headPos.y + wave, headPos.x - 34, headPos.y - 4 + wave * 1.5);
      ctx.moveTo(headPos.x - 12, headPos.y);
      ctx.quadraticCurveTo(headPos.x - 22, headPos.y + 6 + wave, headPos.x - 30, headPos.y + 4 + wave);
      ctx.stroke();
      ctx.restore();
    }
    else if (headgear === 'headset') {
      // Streamer RGB Cat-Ear Headset
      ctx.save();
      // Band over head
      ctx.strokeStyle = '#ff00aa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, headRadius + 3, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();

      // Ear cups
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(headPos.x - 12, headPos.y + 2, 4, 0, Math.PI * 2);
      ctx.arc(headPos.x + 10, headPos.y + 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Cat ear triangles
      ctx.fillStyle = '#ff00aa';
      ctx.beginPath();
      ctx.moveTo(headPos.x - 9, headPos.y - 14);
      ctx.lineTo(headPos.x - 4, headPos.y - 24);
      ctx.lineTo(headPos.x, headPos.y - 15);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(headPos.x + 2, headPos.y - 15);
      ctx.lineTo(headPos.x + 7, headPos.y - 24);
      ctx.lineTo(headPos.x + 11, headPos.y - 14);
      ctx.fill();
      ctx.restore();
    }
    else if (headgear === 'hair' || isFever) {
      // Saiyan spiky golden/neon hair
      ctx.save();
      ctx.fillStyle = isFever ? '#ffea00' : '#00e5ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 14;

      const spikes = [
        { x: -12, y: -10, tx: -18, ty: -24 },
        { x: -8, y: -13, tx: -10, ty: -30 },
        { x: 0, y: -15, tx: 0, ty: -34 },
        { x: 8, y: -12, tx: 12, ty: -28 },
        { x: 12, y: -8, tx: 18, ty: -20 },
      ];

      for (let i = 0; i < spikes.length - 1; i++) {
        const s1 = spikes[i];
        const s2 = spikes[i + 1];
        ctx.beginPath();
        ctx.moveTo(headPos.x + s1.x, headPos.y + s1.y);
        ctx.lineTo(headPos.x + s1.tx, headPos.y + s1.ty);
        ctx.lineTo(headPos.x + s2.x, headPos.y + s2.y);
        ctx.fill();
      }
      ctx.restore();
    }
    else if (headgear === 'horns') {
      // Cyber Demon Horns
      ctx.save();
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(headPos.x - 6, headPos.y - 10);
      ctx.quadraticCurveTo(headPos.x - 14, headPos.y - 22, headPos.x - 16, headPos.y - 24);
      ctx.moveTo(headPos.x + 6, headPos.y - 10);
      ctx.quadraticCurveTo(headPos.x + 14, headPos.y - 22, headPos.x + 16, headPos.y - 24);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw weapons
  drawWeapon(ctx, weapon, pose, state, progress, glowColor) {
    ctx.save();

    if (weapon === 'katana') {
      // Neon katana in front hand
      const h = pose.frontHand;
      const angle = state === 'katana' ? -0.2 : (state === 'idle' ? 0.7 : -0.5);

      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(angle);

      // Katana hilt
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(2, 0);
      ctx.stroke();

      // Glowing Katana Blade
      ctx.strokeStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(52, -2);
      ctx.stroke();

      // Blade shine highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(4, -1);
      ctx.lineTo(50, -3);
      ctx.stroke();
      ctx.restore();
    }
    else if (weapon === 'nunchaku') {
      // Dual linked nunchaku
      const h = pose.frontHand;
      ctx.save();
      ctx.translate(h.x, h.y);
      const spin = (state === 'nunchaku' ? progress * Math.PI * 4 : Date.now() * 0.008);

      ctx.strokeStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3.5;

      // Stick 1
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(spin) * 24, Math.sin(spin) * 24);
      ctx.stroke();

      // Stick 2 attached to other hand
      const h2 = pose.backHand;
      ctx.restore();
      ctx.save();
      ctx.translate(h2.x, h2.y);
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(-spin) * 24, Math.sin(-spin) * 24);
      ctx.stroke();
      ctx.restore();
    }
    else if (weapon === 'staff') {
      // Monkey King Bo Staff
      const h1 = pose.frontHand;
      const h2 = pose.backHand;

      ctx.strokeStyle = '#ff9900';
      ctx.shadowColor = '#ff9900';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 4;

      const dx = h1.x - h2.x;
      const dy = h1.y - h2.y;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(h1.x, h1.y);
      ctx.rotate(angle);

      // Staff extends past both hands
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.lineTo(60, 0);
      ctx.stroke();

      // Golden staff caps
      ctx.fillStyle = '#ffff55';
      ctx.fillRect(-52, -3, 6, 6);
      ctx.fillRect(56, -3, 6, 6);
      ctx.restore();
    }
    else if (weapon === 'sabers') {
      // Dual plasma sabers (magenta / cyan)
      [
        { hand: pose.frontHand, color: '#ff00aa', angle: -0.4 },
        { hand: pose.backHand, color: '#00ffff', angle: 0.6 }
      ].forEach((s) => {
        ctx.save();
        ctx.translate(s.hand.x, s.hand.y);
        ctx.rotate(s.angle);
        ctx.strokeStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(42, 0);
        ctx.stroke();
        ctx.restore();
      });
    }

    ctx.restore();
  }

  // Super Saiyan Aura for Fever Mode
  drawAura(ctx, pose, glowColor) {
    ctx.save();
    const t = Date.now() * 0.008;
    ctx.strokeStyle = glowColor;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 25;

    // Glowing flame contour around stickman
    ctx.beginPath();
    const count = 10;
    for (let i = 0; i <= count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const r = 45 + Math.sin(angle * 4 + t) * 8 + Math.cos(angle * 3 - t) * 6;
      const px = pose.hip.x + Math.cos(angle) * (r * 0.8);
      const py = pose.shoulder.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // Ground shadow oval
  drawShadow(ctx, pose) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(pose.hip.x, 0, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
